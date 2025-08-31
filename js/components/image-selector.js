// js/components/image-selector.js
// Componente reutilizable para selección, compresión y gestión de imágenes

import { PERSISTENCE_CONFIG } from "../config/persistence-config.js";

export class ImageSelector {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      maxFiles: 5,
      showPreview: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB por defecto
      allowedTypes: ["image/*"],
      compressionQuality: 0.8,
      onImageSelect: () => {},
      onImageRemove: () => {},
      onError: () => {},
      ...options,
    };

    this.images = [];
    // Corregir la referencia: IMAGE → IMAGES
    this.imageConfig = PERSISTENCE_CONFIG.IMAGES;

    this.init();
  }

  async init() {
    try {
      this.createHTML();
      this.bindEvents();
      this.addStyles();
      console.log("ImageSelector initialized successfully");
    } catch (error) {
      console.error("Error initializing ImageSelector:", error);
      this.options.onError(error);
    }
  }

  createHTML() {
    const html = `
      <div class="image-selector">
        <div class="image-selector-header">
          <label class="image-selector-label">📷 Photos</label>
          <div class="image-selector-info">
            <span class="image-count">0/${this.options.maxFiles}</span>
            <span class="image-size-limit">Max. ${
              this.imageConfig.MAX_FILE_SIZE / (1024 * 1024)
            }MB</span>
          </div>
        </div>

        <div class="image-drop-zone" id="image-drop-zone">
          <div class="drop-zone-content">
            <div class="drop-icon">📷</div>
            <div class="drop-message">Drag photos here or click to select</div>
            <div class="drop-hint">JPG, PNG, GIF, WebP • Max. ${
              this.imageConfig.MAX_FILE_SIZE / (1024 * 1024)
            }MB per image</div>
            <button type="button" class="select-images-btn">Select Photos</button>
          </div>
        </div>

        <div class="image-preview-container" id="image-preview-container"></div>

        <input type="file" id="image-file-input" multiple accept="image/*" style="display: none;">
      </div>
    `;
    this.container.innerHTML = html;

    // Obtener referencias a elementos
    this.dropZone = this.container.querySelector("#image-drop-zone");
    this.fileInput = this.container.querySelector("#image-file-input");
    this.previewContainer = this.container.querySelector(
      "#image-preview-container"
    );
    this.imageCount = this.container.querySelector(".image-count");
  }

  bindEvents() {
    // Click en el botón de selección - SOLUCIONADO: solo en el botón, no en toda la zona
    const selectBtn = this.container.querySelector(".select-images-btn");
    selectBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Evitar que se propague al contenedor
      this.fileInput.click();
    });

    // Selección de archivos
    this.fileInput.addEventListener("change", (e) =>
      this.handleFileSelection(e.target.files)
    );

    // Drag and drop
    this.dropZone.addEventListener("dragover", (e) => this.handleDragOver(e));
    this.dropZone.addEventListener("drop", (e) => this.handleDrop(e));
    this.dropZone.addEventListener("dragenter", (e) => this.handleDragEnter(e));
    this.dropZone.addEventListener("dragleave", (e) => this.handleDragLeave(e));

    // Click en la zona de drop - SOLUCIONADO: solo abre el selector, no el input
    this.dropZone.addEventListener("click", (e) => {
      // Solo abrir si no se hizo clic en el botón
      if (e.target !== this.container.querySelector(".select-images-btn")) {
        this.fileInput.click();
      }
    });
  }

  addStyles() {
    // Crear estilos inline para evitar dependencias externas
    const styleId = "image-selector-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .image-selector {
        margin: 15px 0;
        font-family: inherit;
        font-size: 14px;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        background: #fafafa;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .image-selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .image-selector-label {
        font-weight: 600;
        color: #333;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .image-selector-info {
        display: flex;
        gap: 15px;
        font-size: 12px;
        color: #666;
      }
      
      .image-drop-zone {
        border: 2px dashed #ccc;
        border-radius: 6px;
        padding: 25px 20px;
        text-align: center;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 15px;
        position: relative;
      }
      
      .image-drop-zone:hover,
      .image-drop-zone.drag-over {
        border-color: #007bff;
        background: #f8f9ff;
        box-shadow: 0 2px 8px rgba(0,123,255,0.1);
      }
      
      .drop-zone-content {
        pointer-events: none;
      }
      
      .drop-icon {
        font-size: 28px;
        margin-bottom: 8px;
        opacity: 0.8;
      }
      
      .drop-message {
        font-size: 15px;
        font-weight: 500;
        color: #333;
        margin-bottom: 6px;
      }
      
      .drop-hint {
        font-size: 12px;
        color: #666;
        margin-bottom: 12px;
        line-height: 1.4;
      }
      
      .select-images-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
        pointer-events: auto;
        transition: all 0.2s ease;
        font-weight: 500;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
      
      .select-images-btn:hover {
        background: #0056b3;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      
      .select-images-btn:active {
        transform: translateY(0);
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
      
      .image-preview-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }
      
      /* Estilo Polaroid/Antiguo para las tarjetas de imagen */
      .image-preview {
        position: relative;
        background: #fefefe;
        border-radius: 3px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        transform: rotate(-1deg);
        margin: 5px;
        /* Marco Polaroid: bordes desiguales */
        padding: 8px 8px 25px 8px; /* Superior: 8px, Laterales: 8px, Inferior: 25px */
      }
      
      .image-preview:hover {
        transform: rotate(0deg) translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.15);
      }
      
      /* Contenedor de la imagen dentro del marco Polaroid */
      .image-preview-inner {
        position: relative;
        border-radius: 2px;
        overflow: hidden;
        background: #000;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
      }
      
      .image-preview img {
        width: 100%;
        height: 100px;
        object-fit: cover;
        display: block;
        filter: sepia(0.1) contrast(1.1) brightness(0.95);
      }
      
      /* Efecto de envejecimiento en los bordes del marco */
      .image-preview::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          45deg,
          transparent 0%,
          rgba(255,248,220,0.1) 20%,
          rgba(255,248,220,0.2) 50%,
          rgba(255,248,220,0.1) 80%,
          transparent 100%
        );
        pointer-events: none;
        border-radius: 3px;
      }
      
      /* Línea sutil en el borde inferior (como en Polaroids reales) */
      .image-preview::after {
        content: '';
        position: absolute;
        bottom: 8px;
        left: 8px;
        right: 8px;
        height: 1px;
        background: rgba(0,0,0,0.1);
        border-radius: 1px;
      }
      
      .image-preview-overlay {
        position: absolute;
        top: 8px;
        left: 8px;
        right: 8px;
        bottom: 25px;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease;
        border-radius: 2px;
      }
      
      .image-preview:hover .image-preview-overlay {
        opacity: 1;
      }
      
      .image-preview-actions {
        display: flex;
        gap: 4px;
        justify-content: center;
      }
      
      .image-action-btn {
        background: rgba(255,255,255,0.95);
        border: none;
        border-radius: 3px;
        padding: 3px 6px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: bold;
        color: #dc3545;
        min-width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .image-action-btn:hover {
        background: white;
        transform: scale(1.1);
        color: #c82333;
      }
      
      .image-preview-info {
        position: absolute;
        bottom: 8px;
        left: 8px;
        right: 8px;
        padding: 4px;
        font-size: 10px;
        color: #666;
        text-align: center;
        background: rgba(255,255,255,0.9);
        border-radius: 2px;
        backdrop-filter: blur(2px);
      }
      
      .image-preview-info .filename {
        font-weight: 500;
        color: #333;
        margin-bottom: 2px;
        word-break: break-word;
        line-height: 1.2;
        font-size: 10px;
      }
      
      .image-preview-info .size {
        color: #999;
        font-size: 9px;
      }
      
      .image-preview.existing {
        border: 2px solid #28a745;
        box-shadow: 0 4px 15px rgba(40,167,69,0.2), 0 1px 3px rgba(40,167,69,0.1);
      }
      
      .image-preview.existing::before {
        content: '✓';
        position: absolute;
        top: 4px;
        right: 4px;
        background: #28a745;
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        z-index: 10;
      }
      
      .image-selector-error {
        color: #dc3545;
        font-size: 12px;
        margin-top: 8px;
        text-align: center;
        padding: 8px;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
      }
      
      .image-selector-loading {
        text-align: center;
        color: #666;
        font-size: 12px;
        margin: 10px 0;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 4px;
      }
      
      /* Estilos para cuando se alcanza el límite */
      .image-drop-zone.max-files-reached {
        border-color: #ffc107;
        background: #fff8e1;
        cursor: not-allowed;
      }
      
      .image-drop-zone.max-files-reached .drop-message {
        color: #856404;
      }
      
      .image-drop-zone.max-files-reached .select-images-btn {
        background: #6c757d;
        cursor: not-allowed;
      }
      
      .image-drop-zone.max-files-reached .select-images-btn:hover {
        background: #6c757d;
        transform: none;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
      
      @media (max-width: 768px) {
        .image-selector {
          padding: 15px;
        }
        
        .image-selector-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
        
        .image-preview-container {
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        }
        
        .image-preview {
          padding: 6px 6px 20px 6px;
        }
        
        .image-preview img {
          height: 80px;
        }
        
        .drop-zone-content {
          padding: 0 10px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // Manejar selección de archivos
  handleFileSelection(files) {
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      this.showError("Please select only image files.");
      return;
    }

    // Verificar límite de archivos
    if (this.images.length + imageFiles.length > this.options.maxFiles) {
      this.showError(`Maximum ${this.options.maxFiles} images allowed.`);
      return;
    }

    // Procesar cada archivo
    imageFiles.forEach((file) => {
      this.processImageFile(file);
    });
  }

  // Manejar drag over
  handleDragOver(e) {
    e.preventDefault();
    this.dropZone.classList.add("drag-over");
  }

  // Manejar drag enter
  handleDragEnter(e) {
    e.preventDefault();
    this.dropZone.classList.add("drag-over");
  }

  // Manejar drag leave
  handleDragLeave(e) {
    e.preventDefault();
    if (!this.dropZone.contains(e.relatedTarget)) {
      this.dropZone.classList.remove("drag-over");
    }
  }

  // Manejar drop
  handleDrop(e) {
    e.preventDefault();
    this.dropZone.classList.remove("drag-over");

    const files = e.dataTransfer.files;
    this.handleFileSelection(files);
  }

  // Procesar archivo de imagen
  async processImageFile(file) {
    try {
      // Verificar tamaño
      if (file.size > this.imageConfig.MAX_FILE_SIZE) {
        this.showError(`File too large: ${file.name}`);
        return;
      }

      // Verificar formato
      if (!this.imageConfig.SUPPORTED_FORMATS.includes(file.type)) {
        this.showError(`Unsupported format: ${file.name}`);
        return;
      }

      // Comprimir imagen
      const compressedFile = await this.compressImage(file);

      // Crear objeto de imagen
      const imageData = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file: compressedFile,
        filename: file.name,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        type: compressedFile.type,
        preview: await this.createPreview(compressedFile),
      };

      // Añadir a la lista
      this.images.push(imageData);

      // Actualizar vista
      this.updateView();

      // Notificar callback
      this.options.onImageSelect(imageData);
    } catch (error) {
      console.error("Error processing image:", error);
      this.showError(`Error processing ${file.name}: ${error.message}`);
    }
  }

  // Comprimir imagen
  async compressImage(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones
        const maxSize = this.imageConfig.MAX_SIZE;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob con calidad configurada
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          this.imageConfig.QUALITY
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Crear vista previa
  async createPreview(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  // Actualizar vista
  updateView() {
    // Actualizar contador
    this.imageCount.textContent = `${this.images.length}/${this.options.maxFiles}`;

    // Actualizar zona de drop
    if (this.images.length >= this.options.maxFiles) {
      this.dropZone.classList.add("max-files-reached");
      this.dropZone.querySelector(".drop-message").textContent =
        "Image limit reached";
    } else {
      this.dropZone.classList.remove("max-files-reached");
      this.dropZone.querySelector(".drop-message").textContent =
        "Drag photos here or click to select";
    }

    // Actualizar previews
    if (this.options.showPreview) {
      this.updatePreviews();
    }
  }

  // Actualizar previews de imágenes
  updatePreviews() {
    this.previewContainer.innerHTML = "";

    this.images.forEach((imageData, index) => {
      const previewItem = this.createPreviewItem(imageData, index);
      this.previewContainer.appendChild(previewItem);
    });
  }

  // Crear elemento de preview
  createPreviewItem(imageData, index) {
    const item = document.createElement("div");
    item.className = `image-preview ${imageData.isExisting ? "existing" : ""}`;
    item.dataset.imageId = imageData.id;

    // Contenedor interno para la imagen (estilo Polaroid)
    const innerContainer = document.createElement("div");
    innerContainer.className = "image-preview-inner";

    const img = document.createElement("img");
    img.src = imageData.preview || imageData.url;
    img.alt = imageData.filename;

    const overlay = document.createElement("div");
    overlay.className = "image-preview-overlay";

    const actions = document.createElement("div");
    actions.className = "image-preview-actions";

    const removeBtn = document.createElement("button");
    removeBtn.className = "image-action-btn";
    removeBtn.innerHTML = "×";
    removeBtn.title = "Remove image";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.removeImage(index);
    });

    actions.appendChild(removeBtn);
    overlay.appendChild(actions);

    const info = document.createElement("div");
    info.className = "image-preview-info";
    info.innerHTML = `
      <div class="filename">${imageData.filename}</div>
      <div class="size">${this.formatFileSize(
        imageData.compressedSize || imageData.size
      )}</div>
    `;

    innerContainer.appendChild(img);
    innerContainer.appendChild(overlay);
    item.appendChild(innerContainer);
    item.appendChild(info);

    return item;
  }

  // Eliminar imagen
  removeImage(index) {
    const imageData = this.images[index];

    // Eliminar de la lista
    this.images.splice(index, 1);

    // Actualizar vista
    this.updateView();

    // Notificar callback
    this.options.onImageRemove(imageData);

    console.log("Image removed:", imageData.filename);
  }

  // Formatear tamaño de archivo
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Obtener imágenes seleccionadas
  getSelectedImages() {
    return [...this.images];
  }

  // Obtener archivos de imágenes
  getImageFiles() {
    return this.images.map((img) => img.file);
  }

  // Limpiar selección
  clearSelection() {
    this.images = [];
    this.updateView();
  }

  // Añadir imagen programáticamente
  addImage(imageData) {
    if (this.images.length >= this.options.maxFiles) {
      this.showError(`Maximum ${this.options.maxFiles} images allowed.`);
      return false;
    }

    this.images.push(imageData);
    this.updateView();
    return true;
  }

  // Eliminar imagen por ID
  removeImageById(imageId) {
    const index = this.images.findIndex((img) => img.id === imageId);
    if (index !== -1) {
      this.removeImage(index);
      return true;
    }
    return false;
  }

  // Verificar si hay imágenes seleccionadas
  hasImages() {
    return this.images.length > 0;
  }

  // Obtener número de imágenes
  getImageCount() {
    return this.images.length;
  }

  // Mostrar error
  showError(message) {
    console.error("ImageSelector Error:", message);

    if (this.options.onError) {
      this.options.onError(message);
    } else {
      // Crear notificación temporal
      const notification = document.createElement("div");
      notification.className = "image-selector-error";
      notification.textContent = message;

      this.container.appendChild(notification);

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }
  }

  // Validar selección
  validate() {
    const errors = [];

    if (this.images.length === 0 && this.options.required) {
      errors.push("You must select at least one image");
    }

    if (this.images.length > this.options.maxFiles) {
      errors.push(`Maximum ${this.options.maxFiles} images allowed`);
    }

    // Validar cada imagen
    this.images.forEach((image, index) => {
      if (image.compressedSize > this.imageConfig.MAX_FILE_SIZE) {
        errors.push(`Image ${index + 1} exceeds maximum size`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Obtener estadísticas
  getStats() {
    const totalSize = this.images.reduce(
      (sum, img) => sum + (img.compressedSize || img.size),
      0
    );
    const originalSize = this.images.reduce(
      (sum, img) => sum + (img.originalSize || img.size),
      0
    );

    return {
      count: this.images.length,
      totalSize,
      originalSize,
      compressionRatio:
        originalSize > 0
          ? (((originalSize - totalSize) / originalSize) * 100).toFixed(1)
          : 0,
      formats: [...new Set(this.images.map((img) => img.type))],
    };
  }

  // Destruir componente
  destroy() {
    try {
      // Limpiar event listeners
      this.dropZone.removeEventListener("drop", this.handleDrop);
      this.fileInput.removeEventListener("change", this.handleFileSelection);

      // Limpiar datos
      this.images = [];

      console.log("ImageSelector destroyed");
    } catch (error) {
      console.error("Error destroying ImageSelector:", error);
    }
  }
}
