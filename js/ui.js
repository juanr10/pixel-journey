// js/ui.js
import { memories, setMemories, pushMemory, deleteMemoryAt } from "./state.js";
import {
  drawMap,
  animateLastSegment,
  focusLastWaypointIfBelowView,
  ensureCapacity,
} from "./render.js";
import { CONFIG, NIGHT_STORAGE_KEY, tileSize } from "./config.js";
import { PersistenceAdapter } from "./adapters/persistence-adapter.js";
import { ImageSelector } from "./components/image-selector.js";

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

  // ======= Referencias al sistema de memories =======
  let persistenceAdapter = null;
  let addImageSelector = null;
  let editImageSelector = null;

  // Inicializar el sistema de memories
  async function initMemorySystem() {
    if (!persistenceAdapter) {
      try {
        persistenceAdapter = new PersistenceAdapter();
        await persistenceAdapter.init();
        console.log("Sistema de memories inicializado en UI");
      } catch (error) {
        console.error("Error inicializando sistema de memories:", error);
      }
    }
    return persistenceAdapter;
  }

  // Obtener el sistema de memories ya inicializado
  function getMemorySystem() {
    return persistenceAdapter;
  }

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

  // ======= Integrar selector de imágenes en modal de añadir =======
  function integrateImageSelectorInAddModal() {
    const memorySystem = getMemorySystem();
    if (!memorySystem) {
      console.log("Sistema de memories no disponible para modal de añadir");
      return;
    }

    try {
      // Crear contenedor para el selector de imágenes
      const imageContainer = document.createElement("div");
      imageContainer.className = "image-selector-container";
      imageContainer.id = "add-image-selector-container";

      // Insertar después del campo de texto
      const addTextContainer = addText.parentNode;
      addTextContainer.parentNode.insertBefore(
        imageContainer,
        addTextContainer.nextSibling
      );

      // Crear el selector de imágenes directamente
      addImageSelector = new ImageSelector(imageContainer, {
        maxFiles: 5,
        showPreview: true,
        onImageSelect: (imageData) => {
          console.log("Imagen seleccionada en modal de añadir:", imageData);
        },
        onImageRemove: (imageData) => {
          console.log("Imagen eliminada en modal de añadir:", imageData);
        },
      });

      console.log("Selector de imágenes integrado en modal de añadir");
    } catch (error) {
      console.error(
        "Error integrando selector de imágenes en modal de añadir:",
        error
      );
    }
  }

  // ======= Integrar selector de imágenes en modal de editar =======
  function integrateImageSelectorInEditModal() {
    const memorySystem = getMemorySystem();
    if (!memorySystem) {
      console.log("Sistema de memories no disponible para modal de editar");
      return;
    }

    try {
      // Crear contenedor para el selector de imágenes
      const imageContainer = document.createElement("div");
      imageContainer.className = "image-selector-container";
      imageContainer.id = "edit-image-selector-container";

      // Insertar después del campo de texto
      const editTextContainer = editText.parentNode;
      editTextContainer.parentNode.insertBefore(
        imageContainer,
        editTextContainer.nextSibling
      );

      // Crear el selector de imágenes directamente
      editImageSelector = new ImageSelector(imageContainer, {
        maxFiles: 5,
        showPreview: true,
        onImageSelect: (imageData) => {
          console.log("Imagen seleccionada en modal de editar:", imageData);
        },
        onImageRemove: (imageData) => {
          console.log("Imagen eliminada en modal de editar:", imageData);
        },
      });

      console.log("Selector de imágenes integrado en modal de editar");
    } catch (error) {
      console.error(
        "Error integrando selector de imágenes en modal de editar:",
        error
      );
    }
  }

  // ======= Open Add modal =======
  function openAddModal() {
    addTitle.value = "";
    addText.value = "";
    addType.value = "camera";
    addMeta.textContent = `Index: ${
      memories.length
    } · Date: ${new Date().toLocaleString()}`;

    // Limpiar selector de imágenes si existe
    if (addImageSelector) {
      addImageSelector.clearSelection();
    }

    showModal(addModal);
    setTimeout(() => addTitle.focus(), 0);
  }

  openAddModalBtn.addEventListener("click", openAddModal);
  cancelAdd.addEventListener("click", () => hideModal(addModal));

  // ======= Save NEW memory =======
  saveAdd.addEventListener("click", async () => {
    const title = addTitle.value.trim();
    const text = addText.value.trim();
    const type = addType.value;
    if (!title || !text) {
      alert("Please complete all fields.");
      return;
    }

    try {
      // Crear datos del memory
      const memoryData = {
        title,
        text,
        type,
        createdAt: new Date().toISOString(),
        position: { x: 0, y: 0 }, // Por defecto, se puede mejorar después
      };

      // Si tenemos el sistema de memories integrado, usarlo
      const memorySystem = getMemorySystem();
      if (memorySystem && memorySystem.persistenceAdapter) {
        const memoryId = await memorySystem.persistenceAdapter.createMemory(
          memoryData
        );
        console.log("Memory creado con sistema integrado:", memoryId);

        // Subir imágenes si las hay
        if (addImageSelector && addImageSelector.hasImages()) {
          const selectedImages = addImageSelector.getSelectedImages();
          console.log(`Subiendo ${selectedImages.length} imágenes...`);

          for (const image of selectedImages) {
            try {
              await memorySystem.persistenceAdapter.uploadImage(
                image.file,
                memoryId
              );
              console.log(`Imagen subida: ${image.filename}`);
            } catch (error) {
              console.error(`Error subiendo imagen ${image.filename}:`, error);
            }
          }
        }

        // Recargar memories desde el sistema integrado
        const allMemories = await memorySystem.persistenceAdapter.getMemories();
        setMemories(allMemories);
      } else {
        // Fallback al sistema original
        pushMemory(memoryData);
      }

      // Ensure canvas grows before animating/drawing
      ensureCapacity();
      focusLastWaypointIfBelowView();
      animateLastSegment();

      hideModal(addModal);
    } catch (error) {
      console.error("Error creando memory:", error);
      alert("Error al crear memory: " + error.message);
    }
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

    // Cargar imágenes existentes si las hay
    if (editImageSelector && m.images && m.images.length > 0) {
      editImageSelector.clearSelection();

      // Añadir imágenes existentes al selector
      for (const image of m.images) {
        const imageData = {
          id: image.id,
          filename: image.filename,
          url: image.url,
          size: image.metadata?.size || 0,
          type: image.metadata?.type || "image/jpeg",
          isExisting: true,
        };
        editImageSelector.addImage(imageData);
      }
    } else if (editImageSelector) {
      editImageSelector.clearSelection();
    }

    showModal(modal);
  });

  // ======= Save edits =======
  saveBtn.addEventListener("click", async () => {
    if (currentIdx == null) return;

    try {
      const title = editTitle.value.trim() || "Memory";
      const text = editText.value.trim();
      const type = editType.value;

      // Si tenemos el sistema de memories integrado, usarlo
      const memorySystem = getMemorySystem();
      if (memorySystem && memorySystem.persistenceAdapter) {
        const memory = memories[currentIdx];
        const updateData = { title, text, type };

        await memorySystem.persistenceAdapter.updateMemory(
          memory.id,
          updateData
        );

        // Subir nuevas imágenes si las hay
        if (editImageSelector && editImageSelector.hasImages()) {
          const selectedImages = editImageSelector.getSelectedImages();
          const newImages = selectedImages.filter((img) => !img.isExisting);

          if (newImages.length > 0) {
            console.log(`Subiendo ${newImages.length} nuevas imágenes...`);

            for (const image of newImages) {
              try {
                await memorySystem.persistenceAdapter.uploadImage(
                  image.file,
                  memory.id
                );
                console.log(`Imagen subida: ${image.filename}`);
              } catch (error) {
                console.error(
                  `Error subiendo imagen ${image.filename}:`,
                  error
                );
              }
            }
          }
        }

        // Recargar memories desde el sistema integrado
        const allMemories = await memorySystem.persistenceAdapter.getMemories();
        setMemories(allMemories);
      } else {
        // Fallback al sistema original
        const next = [...memories];
        next[currentIdx] = { ...next[currentIdx], title, text, type };
        setMemories(next);
      }

      closeEditModal();
      drawMap();
    } catch (error) {
      console.error("Error actualizando memory:", error);
      alert("Error al actualizar memory: " + error.message);
    }
  });

  // ======= Delete memory =======
  deleteBtn.addEventListener("click", async () => {
    if (currentIdx == null) return;
    if (!confirm("Are you sure you want to delete this memory?")) return;

    try {
      // Si tenemos el sistema de memories integrado, usarlo
      const memorySystem = getMemorySystem();
      if (memorySystem && memorySystem.persistenceAdapter) {
        const memory = memories[currentIdx];
        await memorySystem.persistenceAdapter.deleteMemory(memory.id);

        // Recargar memories desde el sistema integrado
        const allMemories = await memorySystem.persistenceAdapter.getMemories();
        setMemories(allMemories);
      } else {
        // Fallback al sistema original
        deleteMemoryAt(currentIdx);
      }

      currentIdx = null;

      // Recompute height and redraw after delete
      ensureCapacity();
      drawMap();

      closeEditModal();
    } catch (error) {
      console.error("Error eliminando memory:", error);
      alert("Error al eliminar memory: " + error.message);
    }
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

  // ======= Inicializar sistema de memories y selectores de imágenes =======
  async function initializeMemorySystem() {
    try {
      await initMemorySystem();
      console.log("Inicializando selectores de imágenes...");
      integrateImageSelectorInAddModal();
      integrateImageSelectorInEditModal();
    } catch (error) {
      console.error("Error inicializando sistema de memories:", error);
    }
  }

  // Inicializar después de un breve delay
  setTimeout(initializeMemorySystem, 100);
}
