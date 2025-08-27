import { memories, setMemories, pushMemory, deleteMemoryAt } from "./state.js";
import {
  drawMap,
  animateLastSegment,
  focusLastWaypointIfBelowView,
} from "./render.js";

export function initUI() {
  const openAddModalBtn = document.getElementById("openAddModal");
  const addModal = document.getElementById("addModal");
  const cancelAdd = document.getElementById("cancelAdd");
  const saveAdd = document.getElementById("saveAdd");
  const addTitle = document.getElementById("addTitle");
  const addText = document.getElementById("addText");
  const addType = document.getElementById("addType");
  const addMeta = document.getElementById("addMeta");

  const modal = document.getElementById("modal");
  const titleEl = document.getElementById("memoryTitle");
  const idRow = document.getElementById("idRow");
  const editTitle = document.getElementById("editTitle");
  const editText = document.getElementById("editText");
  const editType = document.getElementById("editType");
  const saveBtn = document.getElementById("saveBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const closeModalBtn = document.getElementById("closeModal");

  function showModal(el) {
    el.classList.add("show");
    document.body.classList.add("no-scroll");
  }
  function hideModal(el) {
    el.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }
  function closeModal() {
    hideModal(modal);
  }

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
  saveAdd.addEventListener("click", () => {
    const title = addTitle.value.trim(),
      text = addText.value.trim(),
      type = addType.value;
    if (!title || !text) return alert("Completa todos los campos.");
    pushMemory({ title, text, type, createdAt: new Date().toISOString() });
    focusLastWaypointIfBelowView();
    animateLastSegment();
    hideModal(addModal);
  });

  let currentIdx = null;

  // Gestión clicks en el canvas para abrir modal de edición
  const canvas = document.getElementById("map");
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();

    // Recuperar tamaño de tile dinámico leyendo css transform (el render ya usa tileSize fijo, pero aquí deducimos por px)
    // Para fiabilidad mantén 48px por tile; si lo cambias, importa tileSize aquí.
    const tileSize = 48;
    const gx = Math.floor((e.clientX - rect.left) / tileSize);
    const gy = Math.floor((e.clientY - rect.top) / tileSize);

    // localizar waypoint exacto
    import("./path.js").then(({ computeWaypointsAndPolyline }) => {
      import("./state.js").then(({ seed, gridW }) => {
        const { waypoints } = computeWaypointsAndPolyline(
          memories,
          seed,
          gridW
        );
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
    });
  });

  saveBtn.addEventListener("click", () => {
    if (currentIdx == null) return;
    const title = editTitle.value.trim() || "Recuerdo";
    const text = editText.value.trim();
    const type = editType.value;
    const next = [...memories];
    next[currentIdx] = { ...next[currentIdx], title, text, type };
    setMemories(next);
    closeModal();
    drawMap();
  });

  deleteBtn.addEventListener("click", () => {
    if (currentIdx == null) return;
    if (!confirm("¿Seguro que quieres eliminar este recuerdo?")) return;
    deleteMemoryAt(currentIdx);
    currentIdx = null;
    closeModal();
    drawMap();
  });

  document.getElementById("toggleDayNight").addEventListener("change", (e) => {
    import("./config.js").then(({ CONFIG }) => {
      CONFIG.DAY_NIGHT = e.target.checked;
    });
  });

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

  closeModalBtn.addEventListener("click", closeModal);
}
