// js/local-storage/local-storage-adapter.js
// Adaptador para localStorage que implementa la misma interfaz que Firebase

import {
  getLocalStorageConfig,
  getImageConfig,
} from "../config/persistence-config.js";

export class LocalStorageAdapter {
  constructor() {
    this.config = getLocalStorageConfig();
    this.imageConfig = getImageConfig();
    this.memories = [];
    this.paths = [];
    this.isInitialized = false;
    this.callbacks = {
      onMemoriesUpdate: null,
      onMemorySelect: null,
      onMemoryDelete: null,
      onError: null,
    };
  }

  // Inicializar el adaptador
  async init() {
    try {
      // Cargar datos existentes
      await this.loadData();

      this.isInitialized = true;
      console.log("LocalStorageAdapter initialized successfully");
    } catch (error) {
      console.error("Error initializing LocalStorageAdapter:", error);
      throw error;
    }
  }

  // Cargar datos desde localStorage
  async loadData() {
    try {
      // Cargar memories
      const memoriesData = localStorage.getItem(this.config.MEMORIES_KEY);
      this.memories = memoriesData ? JSON.parse(memoriesData) : [];

      // Cargar paths
      const pathsData = localStorage.getItem(this.config.PATHS_KEY);
      this.paths = pathsData ? JSON.parse(pathsData) : [];

      // Migración: añadir campos faltantes a memories existentes
      this.memories.forEach((memory, index) => {
        if (!memory.id) {
          memory.id = `local_${Date.now()}_${index}`;
        }
        if (!memory.createdAt) {
          memory.createdAt = new Date().toISOString();
        }
        if (!memory.updatedAt) {
          memory.updatedAt = memory.createdAt;
        }
        if (!memory.images) {
          memory.images = [];
        }
        if (!memory.metadata) {
          memory.metadata = {};
        }
      });

      // Guardar datos migrados
      await this.saveData();

      console.log(
        `Loaded ${this.memories.length} memories and ${this.paths.length} paths from localStorage`
      );
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      // Si hay error, inicializar con arrays vacíos
      this.memories = [];
      this.paths = [];
    }
  }

  // Guardar datos en localStorage
  async saveData() {
    try {
      localStorage.setItem(
        this.config.MEMORIES_KEY,
        JSON.stringify(this.memories)
      );
      localStorage.setItem(this.config.PATHS_KEY, JSON.stringify(this.paths));
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
      throw error;
    }
  }

  // Crear nuevo memory
  async createMemory(memoryData) {
    try {
      const memory = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...memoryData,
        userId: "default_user",
        images: memoryData.images || [],
        metadata: memoryData.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.memories.push(memory);
      await this.saveData();

      // Notificar actualización
      this.notifyMemoriesUpdate();

      console.log("Memory created in localStorage:", memory.id);
      return memory.id;
    } catch (error) {
      console.error("Error creating memory in localStorage:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Obtener todos los memories
  async getMemories() {
    return [...this.memories].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  // Obtener memory por ID
  async getMemoryById(memoryId) {
    return this.memories.find((m) => m.id === memoryId) || null;
  }

  // Actualizar memory
  async updateMemory(memoryId, updateData) {
    try {
      const index = this.memories.findIndex((m) => m.id === memoryId);
      if (index === -1) {
        throw new Error(`Memory not found: ${memoryId}`);
      }

      this.memories[index] = {
        ...this.memories[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      await this.saveData();

      // Notificar actualización
      this.notifyMemoriesUpdate();

      console.log("Memory updated in localStorage:", memoryId);
    } catch (error) {
      console.error("Error updating memory in localStorage:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Eliminar memory
  async deleteMemory(memoryId) {
    try {
      const index = this.memories.findIndex((m) => m.id === memoryId);
      if (index === -1) {
        throw new Error(`Memory not found: ${memoryId}`);
      }

      // Eliminar memory
      this.memories.splice(index, 1);

      // Eliminar paths asociados
      this.paths = this.paths.filter((p) => p.memoryId !== memoryId);

      await this.saveData();

      // Notificar actualización
      this.notifyMemoriesUpdate();
      this.notifyMemoryDelete(memoryId);

      console.log("Memory deleted from localStorage:", memoryId);
    } catch (error) {
      console.error("Error deleting memory from localStorage:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Subir imagen (convertir a base64 para localStorage)
  async uploadImage(file, memoryId) {
    try {
      // Verificar tamaño del archivo
      if (file.size > this.imageConfig.MAX_FILE_SIZE) {
        throw new Error(
          `Archivo demasiado grande. Máximo: ${
            this.imageConfig.MAX_FILE_SIZE / (1024 * 1024)
          }MB`
        );
      }

      // Verificar formato
      if (!this.imageConfig.SUPPORTED_FORMATS.includes(file.type)) {
        throw new Error(`Formato no soportado: ${file.type}`);
      }

      // Comprimir imagen
      const compressedFile = await this.compressImage(file);

      // Convertir a base64
      const base64Data = await this.fileToBase64(compressedFile);

      // Crear objeto de imagen
      const imageData = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: base64Data,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        metadata: {
          size: compressedFile.size,
          type: compressedFile.type,
          originalSize: file.size,
          storage: "localStorage",
        },
      };

      console.log("Image uploaded to localStorage:", imageData.id);
      return imageData;
    } catch (error) {
      console.error("Error uploading image to localStorage:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Eliminar imagen
  async deleteImage(imageId, memoryId = null) {
    try {
      // Buscar memory que contenga la imagen
      const memoryIndex = this.memories.findIndex(
        (m) => m.images && m.images.some((img) => img.id === imageId)
      );

      if (memoryIndex === -1) {
        throw new Error(`Image not found: ${imageId}`);
      }

      // Eliminar imagen del memory
      this.memories[memoryIndex].images = this.memories[
        memoryIndex
      ].images.filter((img) => img.id !== imageId);

      await this.saveData();

      console.log("Image deleted from localStorage:", imageId);
    } catch (error) {
      console.error("Error deleting image from localStorage:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Añadir path a memory
  async addPathToMemory(memoryId, pathData) {
    try {
      const path = {
        id: `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...pathData,
        memoryId,
        userId: "default_user",
        createdAt: new Date().toISOString(),
      };

      this.paths.push(path);
      await this.saveData();

      console.log("Path added to localStorage:", path.id);
      return path.id;
    } catch (error) {
      console.error("Error adding path to localStorage:", error);
      this.notifyError(error);
      throw error;
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

  // Convertir archivo a base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  // Obtener memories por tipo
  async getMemoriesByType(type) {
    return this.memories.filter((m) => m.type === type);
  }

  // Obtener memories por posición
  async getMemoriesNearPosition(x, y, radius = 2) {
    return this.memories.filter((memory) => {
      const dx = Math.abs(memory.position.x - x);
      const dy = Math.abs(memory.position.y - y);
      return dx <= radius && dy <= radius;
    });
  }

  // Buscar memories
  async searchMemories(query) {
    const searchTerm = query.toLowerCase();
    return this.memories.filter(
      (memory) =>
        memory.title?.toLowerCase().includes(searchTerm) ||
        memory.description?.toLowerCase().includes(searchTerm) ||
        memory.type.toLowerCase().includes(searchTerm)
    );
  }

  // Obtener estadísticas
  async getStats() {
    const stats = {
      total: this.memories.length,
      byType: {},
      withImages: 0,
      withPaths: 0,
      totalImages: 0,
      totalPaths: this.paths.length,
    };

    this.memories.forEach((memory) => {
      // Contar por tipo
      stats.byType[memory.type] = (stats.byType[memory.type] || 0) + 1;

      // Contar con imágenes
      if (memory.images && memory.images.length > 0) {
        stats.withImages++;
        stats.totalImages += memory.images.length;
      }

      // Contar con paths
      if (this.paths.some((p) => p.memoryId === memory.id)) {
        stats.withPaths++;
      }
    });

    return stats;
  }

  // Obtener capacidades del adaptador
  getCapabilities() {
    return [
      "create_memory",
      "read_memory",
      "update_memory",
      "delete_memory",
      "upload_image",
      "delete_image",
      "add_path",
      "search_memories",
      "get_stats",
    ];
  }

  // Obtener estado del adaptador
  getStatus() {
    return {
      initialized: this.isInitialized,
      memoriesCount: this.memories.length,
      pathsCount: this.paths.length,
      storageUsed: this.getStorageUsage(),
      lastSync: new Date().toISOString(),
    };
  }

  // Obtener uso de almacenamiento
  getStorageUsage() {
    try {
      const memoriesSize = JSON.stringify(this.memories).length;
      const pathsSize = JSON.stringify(this.paths).length;
      return {
        memories: memoriesSize,
        paths: pathsSize,
        total: memoriesSize + pathsSize,
        limit: 5 * 1024 * 1024, // 5MB límite aproximado
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Guardar estado (para sincronización)
  async saveState() {
    await this.saveData();
  }

  // Callbacks
  onMemoriesUpdate(callback) {
    this.callbacks.onMemoriesUpdate = callback;
  }

  onMemorySelect(callback) {
    this.callbacks.onMemorySelect = callback;
  }

  onMemoryDelete(callback) {
    this.callbacks.onMemoryDelete = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  // Notificaciones
  notifyMemoriesUpdate() {
    if (this.callbacks.onMemoriesUpdate) {
      this.callbacks.onMemoriesUpdate([...this.memories]);
    }
  }

  notifyMemorySelect(memory) {
    if (this.callbacks.onMemorySelect) {
      this.callbacks.onMemorySelect(memory);
    }
  }

  notifyMemoryDelete(memoryId) {
    if (this.callbacks.onMemoryDelete) {
      this.callbacks.onMemoryDelete(memoryId);
    }
  }

  notifyError(error) {
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  // Limpiar recursos
  async destroy() {
    try {
      await this.saveData();
      this.memories = [];
      this.paths = [];
      this.isInitialized = false;
      this.callbacks = {
        onMemoriesUpdate: null,
        onMemorySelect: null,
        onMemoryDelete: null,
        onError: null,
      };
    } catch (error) {
      console.error("Error destroying LocalStorageAdapter:", error);
    }
  }
}

export default LocalStorageAdapter;
