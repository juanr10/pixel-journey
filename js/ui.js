// js/ui.js
import { memories, setMemories, pushMemory, deleteMemoryAt } from "./state.js";
import {
  drawMap,
  animateLastSegment,
  focusLastWaypointIfBelowView,
  ensureCapacity,
} from "./render.js";
import { CONFIG, NIGHT_STORAGE_KEY, tileSize } from "./config.js";

export function initUI() {
  // ======= Referencias DOM (alta) =======
  const openAddModalBtn = document.getElementById("openAddModal");
  const addModal = document.getElementById("addModal");
  const cancelAdd = document.getElementById("cancelAdd");
  const saveAdd = document.getElementById("saveAdd");
  const addTitle = document.getElementById("addTitle");
  const addText = document.getElementById("addText");
  const addType = document.getElementById("addType");
  const addMeta = document.getElementById("addMeta");

  // ======= Referencias DOM (edición) =======
  const modal = document.getElementById("modal");
  const titleEl = document.getElementById("memoryTitle");
  const idRow = document.getElementById("idRow");
  const editTitle = document.getElementById("editTitle");
  const editText = document.getElementById("editText");
  const editType = document.getElementById("editType");
  const saveBtn = document.getElementById("saveBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const closeModalBtn = document.getElementById("closeModal");

  // ======= Switch noche (manual + persistente) =======
  const toggleNight = document.getElementById("toggleNight");
  if (toggleNight) {
    toggleNight.checked = CONFIG.IS_NIGHT;
    toggleNight.addEventListener("change", () => {
      CONFIG.IS_NIGHT = toggleNight.checked;
      try {
        localStorage.setItem(NIGHT_STORAGE_KEY, CONFIG.IS_NIGHT ? "1" : "0");
      } catch {}
      drawMap(); // aplicar de inmediato overlay/nubes
    });
  }

  // ======= Helpers modales =======
  function showModal(el) {
    el.classList.add("show");
    document.body.classList.add("no-scroll");
  }
  function hideModal(el) {
    el.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }
  function closeEditModal() {
    hideModal(modal);
  }

  // ======= Abrir modal de alta =======
  function openAddModal() {
    addTitle.value = "";
    addText.value = "";
    addType.value = "camera";
    addMeta.textContent = `Índice: ${
      memories.length
    } · Fecha: ${new Date().toLocaleString()}`;
    showModal(addModal);
    setTimeout(() => addTitle.focus(), 0);
  }

  openAddModalBtn.addEventListener("click", openAddModal);
  cancelAdd.addEventListener("click", () => hideModal(addModal));

  // ======= Guardar NUEVO recuerdo =======
  saveAdd.addEventListener("click", () => {
    const title = addTitle.value.trim();
    const text = addText.value.trim();
    const type = addType.value;
    if (!title || !text) {
      alert("Completa todos los campos.");
      return;
    }

    pushMemory({ title, text, type, createdAt: new Date().toISOString() });

    // Asegura que el canvas crece antes de animar/dibujar
    ensureCapacity();
    focusLastWaypointIfBelowView();
    animateLastSegment();

    hideModal(addModal);
  });

  // ======= Clicks en el canvas para abrir edición =======
  let currentIdx = null;
  const canvas = document.getElementById("map");

  canvas.addEventListener("click", async (e) => {
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor((e.clientX - rect.left) / tileSize);
    const gy = Math.floor((e.clientY - rect.top) / tileSize);

    const { computeWaypointsAndPolyline } = await import("./path.js");
    const { seed, gridW } = await import("./state.js");

    const { waypoints } = computeWaypointsAndPolyline(memories, seed, gridW);
    const hit = waypoints.find((w) => w.x === gx && w.y === gy);
    if (!hit) return;

    currentIdx = hit.idx;
    const m = memories[currentIdx];
    const fallback =
      {
        mountain: "Senderismo 🏔️",
        travel: "Viaje ✈️",
        game: "Videojuego 🎮",
        love: "Romántico ❤️",
        camera: "Recuerdo 📸",
      }[m.type] ?? "Recuerdo";

    titleEl.textContent = m.title || fallback;
    idRow.textContent = `Índice: ${currentIdx} · Fecha: ${new Date(
      m.createdAt
    ).toLocaleString()}`;
    editTitle.value = m.title || "";
    editText.value = m.text || "";
    editType.value = m.type;

    showModal(modal);
  });

  // ======= Guardar cambios en edición =======
  saveBtn.addEventListener("click", () => {
    if (currentIdx == null) return;
    const title = editTitle.value.trim() || "Recuerdo";
    const text = editText.value.trim();
    const type = editType.value;

    const next = [...memories];
    next[currentIdx] = { ...next[currentIdx], title, text, type };
    setMemories(next);

    closeEditModal();
    drawMap();
  });

  // ======= Eliminar recuerdo =======
  deleteBtn.addEventListener("click", () => {
    if (currentIdx == null) return;
    if (!confirm("¿Seguro que quieres eliminar este recuerdo?")) return;

    deleteMemoryAt(currentIdx);
    currentIdx = null;

    // Reajusta altura y redibuja tras borrar
    ensureCapacity();
    drawMap();

    closeEditModal();
  });

  // ======= Cierre por fondo / Escape =======
  [addModal, modal].forEach((m) =>
    m.addEventListener("click", (e) => {
      if (e.target === m) hideModal(m);
    })
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (addModal.classList.contains("show")) hideModal(addModal);
      if (modal.classList.contains("show")) hideModal(modal);
    }
  });
  closeModalBtn.addEventListener("click", closeEditModal);
}
