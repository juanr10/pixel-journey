// js/examples/form-integration-example.js
// Ejemplo de cómo integrar el selector de imágenes en formularios existentes

import { PersistenceAdapter } from "../adapters/persistence-adapter.js";
import { ImageSelector } from "../components/image-selector.js";
import { debugConfig } from "../config/persistence-config.js";

// Ejemplo de integración con formularios existentes
export class FormIntegrationExample {
  constructor() {
    this.persistenceAdapter = new PersistenceAdapter();
    this.imageSelector = null;
    this.currentMemoryId = null;
    this.isInitialized = false;
  }

  // Inicializar el sistema
  async init() {
    try {
      // Debug de configuración
      debugConfig();

      // Inicializar adaptador de persistencia
      await this.persistenceAdapter.init();

      this.isInitialized = true;
      console.log("FormIntegrationExample initialized successfully");
    } catch (error) {
      console.error("Error initializing FormIntegrationExample:", error);
      throw error;
    }
  }

  // Integrar selector de imágenes en un formulario existente
  integrateImageSelector(formContainer, options = {}) {
    try {
      // Crear contenedor para el selector de imágenes
      const imageContainer = document.createElement("div");
      imageContainer.className = "image-selector-container";
      imageContainer.id = "image-selector-container";

      // Insertar después del campo de descripción o donde prefieras
      const descriptionField = formContainer.querySelector(
        'textarea[name="description"], .description-field, #memory-description'
      );
      if (descriptionField) {
        descriptionField.parentNode.insertBefore(
          imageContainer,
          descriptionField.nextSibling
        );
      } else {
        // Si no hay campo de descripción, insertar al final del formulario
        formContainer.appendChild(imageContainer);
      }

      // Crear el selector de imágenes
      this.imageSelector = new ImageSelector(imageContainer, {
        maxFiles: options.maxFiles || 5,
        showPreview: true,
        onImageSelect: (imageData) => {
          console.log("Imagen seleccionada:", imageData);
        },
        onImageRemove: (imageData) => {
          console.log("Imagen eliminada:", imageData);
        },
        onError: (error) => {
          console.error("Error en selector de imágenes:", error);
        },
        ...options,
      });

      console.log("ImageSelector integrated successfully");
      return this.imageSelector;
    } catch (error) {
      console.error("Error integrating ImageSelector:", error);
      throw error;
    }
  }

  // Ejemplo: Integrar en formulario de creación de memory
  integrateInMemoryForm() {
    const form = document.querySelector(
      '#memory-form, .memory-form, form[data-type="memory"]'
    );
    if (!form) {
      console.warn("Formulario de memory no encontrado");
      return;
    }

    // Integrar selector de imágenes
    this.integrateImageSelector(form, {
      maxFiles: 10,
      showPreview: true,
    });

    // Modificar el envío del formulario para incluir imágenes
    this.modifyFormSubmission(form);
  }

  // Modificar el envío del formulario para incluir imágenes
  modifyFormSubmission(form) {
    const originalSubmit = form.onsubmit;

    form.onsubmit = async (e) => {
      e.preventDefault();

      try {
        // Obtener datos del formulario
        const formData = new FormData(form);
        const memoryData = {
          type: formData.get("memory-type") || formData.get("type"),
          title: formData.get("memory-title") || formData.get("title"),
          description:
            formData.get("memory-description") || formData.get("description"),
          position: this.getCurrentPosition(), // Implementar según tu lógica
        };

        // Obtener imágenes seleccionadas
        let images = [];
        if (this.imageSelector && this.imageSelector.hasImages()) {
          const selectedImages = this.imageSelector.getSelectedImages();
          images = selectedImages.map((img) => ({
            filename: img.filename,
            file: img.file,
            size: img.compressedSize,
            type: img.type,
          }));
        }

        // Crear memory
        const memoryId = await this.persistenceAdapter.createMemory(memoryData);

        // Subir imágenes si las hay
        if (images.length > 0) {
          console.log(`Subiendo ${images.length} imágenes...`);

          for (const image of images) {
            try {
              await this.persistenceAdapter.uploadImage(image.file, memoryId);
              console.log(`Imagen subida: ${image.filename}`);
            } catch (error) {
              console.error(`Error subiendo imagen ${image.filename}:`, error);
            }
          }
        }

        console.log("Memory creado exitosamente:", memoryId);

        // Limpiar formulario
        form.reset();
        if (this.imageSelector) {
          this.imageSelector.clearSelection();
        }

        // Mostrar mensaje de éxito
        this.showSuccess("Memory creado correctamente");

        // Llamar al callback original si existe
        if (originalSubmit) {
          originalSubmit.call(form, e);
        }
      } catch (error) {
        console.error("Error creando memory:", error);
        this.showError("Error al crear memory: " + error.message);
      }
    };
  }

  // Ejemplo: Integrar en formulario de edición
  integrateInEditForm(memoryId) {
    const form = document.querySelector(
      '#edit-memory-form, .edit-memory-form, form[data-type="edit-memory"]'
    );
    if (!form) {
      console.warn("Formulario de edición no encontrado");
      return;
    }

    // Integrar selector de imágenes
    this.integrateImageSelector(form, {
      maxFiles: 10,
      showPreview: true,
    });

    // Cargar imágenes existentes
    this.loadExistingImages(memoryId);

    // Modificar el envío del formulario
    this.modifyEditFormSubmission(form, memoryId);
  }

  // Cargar imágenes existentes en el selector
  async loadExistingImages(memoryId) {
    try {
      const memory = await this.persistenceAdapter.getMemoryById(memoryId);
      if (memory && memory.images && this.imageSelector) {
        // Convertir imágenes existentes al formato del selector
        for (const image of memory.images) {
          // Crear objeto de imagen compatible
          const imageData = {
            id: image.id,
            filename: image.filename,
            url: image.url,
            size: image.metadata?.size || 0,
            type: image.metadata?.type || "image/jpeg",
            isExisting: true, // Marcar como imagen existente
          };

          this.imageSelector.addImage(imageData);
        }

        console.log(`${memory.images.length} imágenes cargadas`);
      }
    } catch (error) {
      console.error("Error cargando imágenes existentes:", error);
    }
  }

  // Modificar envío del formulario de edición
  modifyEditFormSubmission(form, memoryId) {
    const originalSubmit = form.onsubmit;

    form.onsubmit = async (e) => {
      e.preventDefault();

      try {
        // Obtener datos del formulario
        const formData = new FormData(form);
        const updateData = {
          type: formData.get("memory-type") || formData.get("type"),
          title: formData.get("memory-title") || formData.get("title"),
          description:
            formData.get("memory-description") || formData.get("description"),
        };

        // Obtener imágenes del selector
        let newImages = [];
        if (this.imageSelector && this.imageSelector.hasImages()) {
          const selectedImages = this.imageSelector.getSelectedImages();
          newImages = selectedImages.filter((img) => !img.isExisting); // Solo imágenes nuevas
        }

        // Actualizar memory
        await this.persistenceAdapter.updateMemory(memoryId, updateData);

        // Subir nuevas imágenes
        if (newImages.length > 0) {
          console.log(`Subiendo ${newImages.length} nuevas imágenes...`);

          for (const image of newImages) {
            try {
              await this.persistenceAdapter.uploadImage(image.file, memoryId);
              console.log(`Imagen subida: ${image.filename}`);
            } catch (error) {
              console.error(`Error subiendo imagen ${image.filename}:`, error);
            }
          }
        }

        console.log("Memory actualizado exitosamente");
        this.showSuccess("Memory actualizado correctamente");

        // Llamar al callback original si existe
        if (originalSubmit) {
          originalSubmit.call(form, e);
        }
      } catch (error) {
        console.error("Error actualizando memory:", error);
        this.showError("Error al actualizar memory: " + error.message);
      }
    };
  }

  // Ejemplo: Integrar en formulario personalizado
  integrateInCustomForm(formSelector, options = {}) {
    const form = document.querySelector(formSelector);
    if (!form) {
      console.warn(`Formulario no encontrado: ${formSelector}`);
      return;
    }

    // Integrar selector de imágenes
    this.integrateImageSelector(form, options);

    // Configurar validación personalizada
    this.setupCustomValidation(form);

    return this.imageSelector;
  }

  // Configurar validación personalizada
  setupCustomValidation(form) {
    const submitButton = form.querySelector(
      'button[type="submit"], input[type="submit"], .submit-btn'
    );
    if (submitButton) {
      submitButton.addEventListener("click", (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault();
          return false;
        }
      });
    }
  }

  // Validar formulario
  validateForm(form) {
    const errors = [];

    // Validar campos requeridos
    const requiredFields = form.querySelectorAll("[required]");
    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        errors.push(
          `Campo requerido: ${field.name || field.placeholder || "Campo"}`
        );
      }
    });

    // Validar selector de imágenes
    if (this.imageSelector) {
      const imageValidation = this.imageSelector.validate();
      if (!imageValidation.isValid) {
        errors.push(...imageValidation.errors);
      }
    }

    // Mostrar errores si los hay
    if (errors.length > 0) {
      this.showErrors(errors);
      return false;
    }

    return true;
  }

  // Obtener posición actual (implementar según tu lógica)
  getCurrentPosition() {
    // Por ahora retornamos una posición por defecto
    // Deberías implementar esto para obtener la posición del cursor o selección
    return { x: 0, y: 0 };
  }

  // Utilidades de notificación
  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showErrors(errors) {
    const message = errors.join("\n");
    this.showNotification(message, "error");
  }

  showNotification(message, type = "info") {
    // Crear notificación temporal
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Añadir estilos
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      max-width: 400px;
      word-wrap: break-word;
    `;

    // Colores según tipo
    const colors = {
      success: "#28a745",
      error: "#dc3545",
      info: "#17a2b8",
    };

    notification.style.backgroundColor = colors[type] || colors.info;

    // Añadir al DOM
    document.body.appendChild(notification);

    // Eliminar después de 5 segundos
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  // Obtener estadísticas del selector
  getImageSelectorStats() {
    if (!this.imageSelector) return null;
    return this.imageSelector.getStats();
  }

  // Limpiar selección de imágenes
  clearImageSelection() {
    if (this.imageSelector) {
      this.imageSelector.clearSelection();
    }
  }

  // Obtener imágenes seleccionadas
  getSelectedImages() {
    if (!this.imageSelector) return [];
    return this.imageSelector.getSelectedImages();
  }

  // Obtener archivos de imágenes
  getImageFiles() {
    if (!this.imageSelector) return [];
    return this.imageSelector.getImageFiles();
  }

  // Cambiar tipo de persistencia
  async switchPersistenceType(type) {
    try {
      await this.persistenceAdapter.switchPersistenceType(type);
      console.log(`Persistencia cambiada a: ${type}`);
      return true;
    } catch (error) {
      console.error("Error cambiando tipo de persistencia:", error);
      throw error;
    }
  }

  // Obtener información del adaptador activo
  getActiveAdapterInfo() {
    return this.persistenceAdapter.getActiveAdapterInfo();
  }

  // Obtener estadísticas de uso
  async getUsageStats() {
    return await this.persistenceAdapter.getUsageStats();
  }

  // Limpiar recursos
  async destroy() {
    if (this.imageSelector) {
      this.imageSelector.destroy();
    }

    if (this.persistenceAdapter) {
      await this.persistenceAdapter.destroy();
    }

    this.isInitialized = false;
  }
}

// Función de inicialización global
export async function initFormIntegration() {
  const integration = new FormIntegrationExample();
  await integration.init();

  // Hacer disponible globalmente
  window.formIntegration = integration;

  return integration;
}

// Ejemplo de uso:
/*
// En tu archivo principal:
import { initFormIntegration } from './examples/form-integration-example.js';

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const integration = await initFormIntegration();
    
    // Integrar en formulario existente
    integration.integrateInMemoryForm();
    
    // O integrar en formulario personalizado
    integration.integrateInCustomForm('#my-custom-form', {
      maxFiles: 5,
      showPreview: true
    });
    
  } catch (error) {
    console.error('Failed to initialize form integration:', error);
  }
});
*/
