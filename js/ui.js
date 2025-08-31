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
  // ======= DOM refs (Add) =======
  const openAddModalBtn = document.getElementById("openAddModal");
  const addModal = document.getElementById("addModal");
  const cancelAdd = document.getElementById("cancelAdd");
  const saveAdd = document.getElementById("saveAdd");
  const addTitle = document.getElementById("addTitle");
  const addText = document.getElementById("addText");
  const addType = document.getElementById("addType");
  const addMeta = document.getElementById("addMeta");

  // ======= DOM refs (Edit) =======
  const modal = document.getElementById("modal");
  const titleEl = document.getElementById("memoryTitle");
  const idRow = document.getElementById("idRow");
  const editTitle = document.getElementById("editTitle");
  const editText = document.getElementById("editText");
  const editType = document.getElementById("editType");
  const saveBtn = document.getElementById("saveBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const closeModalBtn = document.getElementById("closeModal");

  // ======= Night switch (manual + persistent) =======
  const toggleNight = document.getElementById("toggleNight");
  if (toggleNight) {
    toggleNight.checked = CONFIG.IS_NIGHT;
    toggleNight.addEventListener("change", () => {
      CONFIG.IS_NIGHT = toggleNight.checked;
      try {
        localStorage.setItem(NIGHT_STORAGE_KEY, CONFIG.IS_NIGHT ? "1" : "0");
      } catch {}
      drawMap(); // apply overlay/clouds immediately
    });
  }

  // ======= Modal helpers (con cierre suave) =======
  function showModal(el) {
    el.classList.remove("closing"); // por si quedó en ese estado
    el.classList.add("show");
    document.body.classList.add("no-scroll");
  }
  function hideModal(el) {
    // Si ya está oculto, no hacemos nada
    if (!el.classList.contains("show")) return;

    // Añadimos estado intermedio para animar salida
    el.classList.add("closing");

    // Esperamos a que termine la transición del contenedor
    const onEnd = (ev) => {
      if (ev.target !== el) return; // nos aseguramos de que es la transición del overlay, no la del inner
      el.removeEventListener("transitionend", onEnd);
      el.classList.remove("show", "closing"); // ahora sí ocultamos del todo
      document.body.classList.remove("no-scroll");
    };
    el.addEventListener("transitionend", onEnd);

    // Fallback por si transitionend no dispara (p. ej. navegadores raros)
    setTimeout(() => {
      if (el.classList.contains("closing")) {
        el.classList.remove("show", "closing");
        document.body.classList.remove("no-scroll");
      }
    }, 350);
  }
  function closeEditModal() {
    hideModal(modal);
  }

  // ======= Open Add modal =======
  function openAddModal() {
    addTitle.value = "";
    addText.value = "";
    addType.value = "camera";
    addMeta.textContent = `Index: ${
      memories.length
    } · Date: ${new Date().toLocaleString()}`;
    showModal(addModal);
    setTimeout(() => addTitle.focus(), 0);
  }

  openAddModalBtn.addEventListener("click", openAddModal);
  cancelAdd.addEventListener("click", () => hideModal(addModal));

  // ======= Save NEW memory =======
  saveAdd.addEventListener("click", () => {
    const title = addTitle.value.trim();
    const text = addText.value.trim();
    const type = addType.value;
    if (!title || !text) {
      alert("Please complete all fields.");
      return;
    }

    pushMemory({ title, text, type, createdAt: new Date().toISOString() });

    // Ensure canvas grows before animating/drawing
    ensureCapacity();
    focusLastWaypointIfBelowView();
    animateLastSegment();

    hideModal(addModal);
  });

  // ======= Click on canvas -> open Edit modal =======
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
        mountain: "Hiking 🏔️",
        travel: "Travel ✈️",
        game: "Video game 🎮",
        love: "Romantic ❤️",
        camera: "Memory 📸",
        museo: "Museum / Monument 🏛️",
      }[m.type] ?? "Memory";

    titleEl.textContent = m.title || fallback;
    idRow.textContent = `Index: ${currentIdx} · Date: ${new Date(
      m.createdAt
    ).toLocaleString()}`;
    editTitle.value = m.title || "";
    editText.value = m.text || "";
    editType.value = m.type;

    showModal(modal);
  });

  // ======= Save edits =======
  saveBtn.addEventListener("click", () => {
    if (currentIdx == null) return;
    const title = editTitle.value.trim() || "Memory";
    const text = editText.value.trim();
    const type = editType.value;

    const next = [...memories];
    next[currentIdx] = { ...next[currentIdx], title, text, type };
    setMemories(next);

    closeEditModal();
    drawMap();
  });

  // ======= Delete memory =======
  deleteBtn.addEventListener("click", () => {
    if (currentIdx == null) return;
    if (!confirm("Are you sure you want to delete this memory?")) return;

    deleteMemoryAt(currentIdx);
    currentIdx = null;

    // Recompute height and redraw after delete
    ensureCapacity();
    drawMap();

    closeEditModal();
  });

  // ======= Close on backdrop / Esc =======
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
