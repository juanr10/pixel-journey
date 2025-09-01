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

        // Log de debug para verificar qué adaptador está activo
        const adapterInfo = persistenceAdapter.getActiveAdapterInfo();
        console.log("Sistema de memories inicializado en UI");
        console.log("🔍 DEBUG - Adaptador activo:", adapterInfo);
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

  // ======= Crear sistema de pestañas para modal de añadir =======
  function createAddModalTabs() {
    const memorySystem = getMemorySystem();
    if (!memorySystem) {
      console.log("Sistema de memories no disponible para modal de añadir");
      return;
    }

    try {
      // Crear contenedor de pestañas
      const tabsContainer = document.createElement("div");
      tabsContainer.className = "modal-tabs-container";
      tabsContainer.id = "add-modal-tabs";

      // Insertar después del meta (Index y Date)
      const modalInner = addModal.querySelector(".modalInner");
      const meta = modalInner.querySelector("#addMeta");
      modalInner.insertBefore(tabsContainer, meta.nextSibling);

      // Crear HTML de pestañas
      const tabsHTML = `
        <div class="modal-tabs">
          <button type="button" class="tab-button active" data-tab="basic">
            📝 Basic Info
          </button>
          <button type="button" class="tab-button" data-tab="images">
            📷 Photos
          </button>
        </div>
        <div class="tab-content">
          <div class="tab-pane active" id="add-basic-tab">
            <!-- Los campos básicos se mantienen en su lugar original -->
          </div>
          <div class="tab-pane" id="add-images-tab" style="display: none;">
            <div class="image-selector-container" id="add-image-selector-container" style="display: block; visibility: visible; opacity: 1;"></div>
          </div>
        </div>
      `;
      tabsContainer.innerHTML = tabsHTML;

      // El ImageSelector se creará cuando se muestre la pestaña de imágenes

      // Configurar eventos de pestañas
      setupTabEvents(tabsContainer);
    } catch (error) {
      console.error("Error creando pestañas en modal de añadir:", error);
    }
  }

  // ======= Crear sistema de pestañas para modal de editar =======
  function createEditModalTabs() {
    const memorySystem = getMemorySystem();
    if (!memorySystem) {
      console.log("Sistema de memories no disponible para modal de editar");
      return;
    }

    try {
      // Crear contenedor de pestañas
      const tabsContainer = document.createElement("div");
      tabsContainer.className = "modal-tabs-container";
      tabsContainer.id = "edit-modal-tabs";

      // Insertar después del meta (ID)
      const modalInner = modal.querySelector(".modalInner");
      const meta = modalInner.querySelector("#idRow");
      modalInner.insertBefore(tabsContainer, meta.nextSibling);

      // Crear HTML de pestañas
      const tabsHTML = `
        <div class="modal-tabs">
          <button type="button" class="tab-button active" data-tab="basic">
            📝 Basic Info
          </button>
          <button type="button" class="tab-button" data-tab="images">
            📷 Photos
          </button>
        </div>
        <div class="tab-content">
          <div class="tab-pane active" id="edit-basic-tab">
            <!-- Los campos básicos se mantienen en su lugar original -->
          </div>
          <div class="tab-pane" id="edit-images-tab" style="display: none;">
            <div class="image-selector-container" id="edit-image-selector-container" style="display: block; visibility: visible; opacity: 1;"></div>
          </div>
        </div>
      `;
      tabsContainer.innerHTML = tabsHTML;

      // El ImageSelector se creará cuando se muestre la pestaña de imágenes

      // Configurar eventos de pestañas
      setupTabEvents(tabsContainer);
    } catch (error) {
      console.error("Error creando pestañas en modal de editar:", error);
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

    // Resetear ImageSelector
    addImageSelector = null;

    // Resetear pestañas a "Basic Info"
    const tabsContainer = addModal.querySelector("#add-modal-tabs");
    if (tabsContainer) {
      const tabButtons = tabsContainer.querySelectorAll(".tab-button");
      const tabPanes = tabsContainer.querySelectorAll(".tab-pane");

      // Activar pestaña básica
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabPanes.forEach((pane) => {
        pane.classList.remove("active");
        pane.style.display = "none";
      });

      const basicButton = tabsContainer.querySelector('[data-tab="basic"]');
      const basicPane = tabsContainer.querySelector("#add-basic-tab");
      const imagesPane = tabsContainer.querySelector("#add-images-tab");

      if (basicButton) basicButton.classList.add("active");
      if (basicPane) {
        basicPane.classList.add("active");
        basicPane.style.display = "block";
      }
      if (imagesPane) {
        imagesPane.style.display = "none";
      }

      // Mostrar campos básicos
      const formRows = addModal.querySelectorAll(".formRow");
      formRows.forEach((row) => (row.style.display = "flex"));
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
      // Calcular posición para el nuevo memory basándose en waypoints existentes
      const { computeWaypointsAndPolyline } = await import("./path.js");
      const { seed, gridW } = await import("./state.js");

      // Obtener memories existentes para calcular la siguiente posición
      const memorySystem = getMemorySystem();
      const existingMemories = memorySystem
        ? await memorySystem.getMemories()
        : memories;

      // Calcular waypoints incluyendo el nuevo memory
      const { waypoints } = computeWaypointsAndPolyline(
        [...existingMemories, { type, title, text }], // Memory temporal para el cálculo
        seed,
        gridW
      );

      // La última posición será para el nuevo memory
      const lastWaypoint = waypoints[waypoints.length - 1];
      const position = { x: lastWaypoint.x, y: lastWaypoint.y };

      console.log("🔍 DEBUG - Posición calculada para nuevo memory:", position);

      // Crear datos del memory
      const memoryData = {
        title,
        text,
        type,
        createdAt: new Date().toISOString(),
        position, // Usar la posición calculada
      };

      // Si tenemos el sistema de memories integrado, usarlo
      if (memorySystem) {
        console.log(
          "🔍 DEBUG - Creando memory con adaptador:",
          memorySystem.getActiveAdapterInfo()?.name
        );
        const memoryId = await memorySystem.createMemory(memoryData);
        console.log("Memory creado con sistema integrado:", memoryId);
        console.log("🔍 DEBUG - Memory data guardado:", memoryData);

        // Subir imágenes si las hay
        if (addImageSelector && addImageSelector.hasImages()) {
          const selectedImages = addImageSelector.getSelectedImages();
          console.log(`Subiendo ${selectedImages.length} imágenes...`);

          const uploadedImages = [];
          for (const image of selectedImages) {
            try {
              const imageData = await memorySystem.uploadImage(
                image.file,
                memoryId
              );
              uploadedImages.push(imageData);
              console.log(`Imagen subida: ${image.filename}`);
            } catch (error) {
              console.error(`Error subiendo imagen ${image.filename}:`, error);
            }
          }

          // Actualizar el memory con la información de las imágenes
          if (uploadedImages.length > 0) {
            try {
              await memorySystem.updateMemory(memoryId, {
                images: uploadedImages,
              });
              console.log("Memory actualizado con imágenes:", uploadedImages);
            } catch (error) {
              console.error("Error actualizando memory con imágenes:", error);
            }
          }
        }

        // Recargar memories desde el sistema integrado
        const allMemories = await memorySystem.getMemories();
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

    // Resetear ImageSelector
    editImageSelector = null;

    // Resetear pestañas a "Basic Info" en modal de editar
    const tabsContainer = modal.querySelector("#edit-modal-tabs");
    if (tabsContainer) {
      const tabButtons = tabsContainer.querySelectorAll(".tab-button");
      const tabPanes = tabsContainer.querySelectorAll(".tab-pane");

      // Activar pestaña básica
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabPanes.forEach((pane) => {
        pane.classList.remove("active");
        pane.style.display = "none";
      });

      const basicButton = tabsContainer.querySelector('[data-tab="basic"]');
      const basicPane = tabsContainer.querySelector("#edit-basic-tab");
      const imagesPane = tabsContainer.querySelector("#edit-images-tab");

      if (basicButton) basicButton.classList.add("active");
      if (basicPane) {
        basicPane.classList.add("active");
        basicPane.style.display = "block";
      }
      if (imagesPane) {
        imagesPane.style.display = "none";
      }

      // Mostrar campos básicos
      const formRows = modal.querySelectorAll(".formRow");
      formRows.forEach((row) => (row.style.display = "flex"));
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
      if (memorySystem) {
        const memory = memories[currentIdx];
        const updateData = { title, text, type };

        await memorySystem.updateMemory(memory.id, updateData);

        // Subir nuevas imágenes si las hay
        if (editImageSelector && editImageSelector.hasImages()) {
          const selectedImages = editImageSelector.getSelectedImages();
          const newImages = selectedImages.filter((img) => !img.isExisting);
          const existingImages = selectedImages.filter((img) => img.isExisting);

          if (newImages.length > 0) {
            console.log(`Subiendo ${newImages.length} nuevas imágenes...`);

            const uploadedImages = [];
            for (const image of newImages) {
              try {
                // Verificar si ya existe una imagen con el mismo contenido en el memory
                const isDuplicateInMemory = memory.images?.some(
                  (existingImg) => existingImg.contentHash === image.contentHash
                );

                if (isDuplicateInMemory) {
                  console.log(
                    `Imagen duplicada detectada, omitiendo: ${image.filename}`
                  );
                  continue;
                }

                const imageData = await memorySystem.uploadImage(
                  image.file,
                  memory.id
                );
                uploadedImages.push(imageData);
                console.log(`Imagen subida: ${image.filename}`);
              } catch (error) {
                console.error(
                  `Error subiendo imagen ${image.filename}:`,
                  error
                );
              }
            }

            // Combinar imágenes existentes con las nuevas
            const allImages = [...existingImages, ...uploadedImages];

            // Actualizar el memory con todas las imágenes
            try {
              await memorySystem.updateMemory(memory.id, { images: allImages });
              console.log(
                "Memory actualizado con todas las imágenes:",
                allImages
              );
            } catch (error) {
              console.error("Error actualizando memory con imágenes:", error);
            }
          } else if (existingImages.length > 0) {
            // Solo actualizar si hay cambios en las imágenes existentes
            try {
              await memorySystem.updateMemory(memory.id, {
                images: existingImages,
              });
              console.log(
                "Memory actualizado con imágenes existentes:",
                existingImages
              );
            } catch (error) {
              console.error(
                "Error actualizando memory con imágenes existentes:",
                error
              );
            }
          }
        }

        // Recargar memories desde el sistema integrado
        const allMemories = await memorySystem.getMemories();
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
      // Si tenemos el sistema integrado, usarlo
      const memorySystem = getMemorySystem();
      if (memorySystem) {
        const memory = memories[currentIdx];
        await memorySystem.deleteMemory(memory.id);

        // Recargar memories desde el sistema integrado
        const allMemories = await memorySystem.getMemories();
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

  // ======= Función para configurar eventos de pestañas =======
  function setupTabEvents(tabsContainer) {
    const tabButtons = tabsContainer.querySelectorAll(".tab-button");
    const tabPanes = tabsContainer.querySelectorAll(".tab-pane");
    const modal = tabsContainer.closest(".modal");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetTab = button.getAttribute("data-tab");

        // Remover clase active de todos los botones y paneles
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        tabPanes.forEach((pane) => pane.classList.remove("active"));

        // Activar el botón y panel seleccionado
        button.classList.add("active");
        const targetPane = tabsContainer.querySelector(
          `#${tabsContainer.id.replace("-tabs", "")}-${targetTab}-tab`
        );
        if (targetPane) {
          targetPane.classList.add("active");
        }

        // Mostrar/ocultar campos según la pestaña
        const formRows = modal.querySelectorAll(".formRow");
        if (targetTab === "basic") {
          formRows.forEach((row) => (row.style.display = "flex"));
        } else {
          formRows.forEach((row) => (row.style.display = "none"));
        }

        // Manejar visibilidad de pestañas
        modal.querySelectorAll(".tab-pane").forEach((pane) => {
          if (pane.id.includes(targetTab)) {
            pane.classList.add("active");
            pane.style.display = "block";
          } else {
            pane.classList.remove("active");
            pane.style.display = "none";
          }
        });

        // Manejar visibilidad del contenedor de imágenes
        if (targetTab === "images") {
          const imageContainer = modal.querySelector(
            ".image-selector-container"
          );
          if (imageContainer) {
            // Forzar visibilidad del contenedor de imágenes
            imageContainer.style.display = "block";
            imageContainer.style.visibility = "visible";
            imageContainer.style.opacity = "1";

            // Determinar qué modal es y crear el ImageSelector correspondiente
            const isAddModal = modal.id === "addModal";
            const isEditModal = modal.id === "modal";

            if (isAddModal && !addImageSelector) {
              addImageSelector = new ImageSelector(imageContainer, {
                uniqueId: "add-modal-image-selector", // ID único para el modal de añadir
                maxFiles: 5,
                showPreview: true,
                onImageSelect: (imageData) => {
                  console.log(
                    "Imagen seleccionada en modal de añadir:",
                    imageData
                  );
                },
                onImageRemove: async (imageData) => {
                  console.log(
                    "Imagen eliminada en modal de añadir:",
                    imageData
                  );
                  // Si es una imagen existente, eliminarla del storage
                  if (imageData.isExisting && imageData.id) {
                    try {
                      const memorySystem = getMemorySystem();
                      if (memorySystem) {
                        await memorySystem.deleteImage(imageData.id);
                        console.log(
                          "Imagen eliminada del storage:",
                          imageData.id
                        );
                      }
                    } catch (error) {
                      console.error(
                        "Error eliminando imagen del storage:",
                        error
                      );
                    }
                  }
                },
              });
            } else if (isEditModal) {
              // Obtener las imágenes existentes del memory actual
              const currentMemory = memories[currentIdx];
              const existingImages = currentMemory?.images || [];

              // Siempre crear un nuevo ImageSelector para asegurar que tenga las imágenes correctas
              editImageSelector = new ImageSelector(imageContainer, {
                uniqueId: `edit-modal-image-selector-${currentIdx}-${Date.now()}`, // ID único con timestamp
                maxFiles: 5,
                showPreview: true,
                existingImages: existingImages, // Pasar imágenes existentes del memory
                onImageSelect: (imageData) => {
                  console.log(
                    "Imagen seleccionada en modal de editar:",
                    imageData
                  );
                },
                onImageRemove: async (imageData) => {
                  console.log(
                    "Imagen eliminada en modal de editar:",
                    imageData
                  );
                  // Si es una imagen existente, eliminarla del storage
                  if (imageData.isExisting && imageData.id) {
                    try {
                      const memorySystem = getMemorySystem();
                      if (memorySystem) {
                        await memorySystem.deleteImage(imageData.id);
                        console.log(
                          "Imagen eliminada del storage:",
                          imageData.id
                        );
                      }
                    } catch (error) {
                      console.error(
                        "Error eliminando imagen del storage:",
                        error
                      );
                    }
                  }
                },
              });
            }
          }
        }
      });
    });
  }

  // ======= Inicializar sistema de memories y pestañas =======
  async function initializeMemorySystem() {
    try {
      await initMemorySystem();
      console.log("Inicializando sistema de pestañas...");
      createAddModalTabs();
      createEditModalTabs();
    } catch (error) {
      console.error("Error inicializando sistema de memories:", error);
    }
  }

  // Inicializar después de un breve delay
  setTimeout(initializeMemorySystem, 100);
}
