// js/adapters/persistence-adapter.js
// Adaptador de persistencia que permite cambiar entre localStorage y Firebase

import {
  PERSISTENCE_CONFIG,
  isFirebaseAvailable,
  isLocalStorageAvailable,
} from "../config/persistence-config.js";

// Singleton instance
let singletonInstance = null;

// Importar implementaciones
let FirebaseAdapter = null;
let LocalStorageAdapter = null;

// Importación dinámica para evitar errores si Firebase no está configurado
async function loadAdapters() {
  try {
    if (isFirebaseAvailable()) {
      FirebaseAdapter = (await import("../firebase/firebase-adapter.js"))
        .default;
    }
  } catch (error) {
    console.warn("Firebase adapter no disponible:", error.message);
  }

  try {
    if (isLocalStorageAvailable()) {
      LocalStorageAdapter = (
        await import("../local-storage/local-storage-adapter.js")
      ).default;
    }
  } catch (error) {
    console.warn("LocalStorage adapter no disponible:", error.message);
  }
}

export class PersistenceAdapter {
  constructor() {
    // Singleton pattern - solo una instancia
    if (singletonInstance) {
      return singletonInstance;
    }

    this.firebaseAdapter = null;
    this.localStorageAdapter = null;
    this.activeAdapter = null;
    this.isInitialized = false;
    this.callbacks = {
      onMemoriesUpdate: null,
      onMemorySelect: null,
      onMemoryDelete: null,
      onError: null,
    };

    // Guardar la instancia singleton
    singletonInstance = this;
  }

  // Inicializar el adaptador
  async init() {
    // Si ya está inicializado, no hacer nada
    if (this.isInitialized) {
      console.log("PersistenceAdapter ya está inicializado");
      return;
    }

    try {
      // Cargar adaptadores disponibles
      await loadAdapters();

      // Inicializar adaptadores según configuración
      if (isFirebaseAvailable() && FirebaseAdapter) {
        this.firebaseAdapter = new FirebaseAdapter();
        await this.firebaseAdapter.init();
      }

      if (isLocalStorageAvailable() && LocalStorageAdapter) {
        this.localStorageAdapter = new LocalStorageAdapter();
        await this.localStorageAdapter.init();
      }

      // Configurar adaptador activo
      this.setActiveAdapter(PERSISTENCE_CONFIG.TYPE);

      this.isInitialized = true;
      console.log("PersistenceAdapter initialized successfully");
    } catch (error) {
      console.error("Error initializing PersistenceAdapter:", error);
      throw error;
    }
  }

  // Configurar adaptador activo
  setActiveAdapter(type) {
    switch (type) {
      case "firebase":
        if (this.firebaseAdapter) {
          this.activeAdapter = this.firebaseAdapter;
          console.log("Firebase adapter activado");
        } else {
          throw new Error("Firebase adapter no disponible");
        }
        break;

      case "localStorage":
        if (this.localStorageAdapter) {
          this.activeAdapter = this.localStorageAdapter;
          console.log("LocalStorage adapter activado");
        } else {
          throw new Error("LocalStorage adapter no disponible");
        }
        break;

      case "hybrid":
        // En modo híbrido, Firebase es el principal y localStorage es backup
        if (this.firebaseAdapter && this.localStorageAdapter) {
          this.activeAdapter = this.firebaseAdapter;
          console.log("Modo híbrido: Firebase principal, LocalStorage backup");
        } else {
          throw new Error("Ambos adaptadores son necesarios para modo híbrido");
        }
        break;

      default:
        throw new Error(`Tipo de persistencia no soportado: ${type}`);
    }

    // Configurar callbacks del adaptador activo
    this.setupAdapterCallbacks();
  }

  // Configurar callbacks del adaptador activo
  setupAdapterCallbacks() {
    if (!this.activeAdapter) return;

    // Configurar callbacks del adaptador activo
    if (this.callbacks.onMemoriesUpdate) {
      this.activeAdapter.onMemoriesUpdate(this.callbacks.onMemoriesUpdate);
    }

    if (this.callbacks.onMemorySelect) {
      this.activeAdapter.onMemorySelect(this.callbacks.onMemorySelect);
    }

    if (this.callbacks.onMemoryDelete) {
      this.activeAdapter.onMemoryDelete(this.callbacks.onMemoryDelete);
    }

    if (this.callbacks.onError) {
      this.activeAdapter.onError(this.callbacks.onError);
    }
  }

  // Cambiar tipo de persistencia en runtime
  async switchPersistenceType(type) {
    if (!this.isInitialized) {
      throw new Error("PersistenceAdapter no está inicializado");
    }

    try {
      // Guardar estado actual si es necesario
      if (this.activeAdapter && this.activeAdapter.saveState) {
        await this.activeAdapter.saveState();
      }

      // Cambiar adaptador
      this.setActiveAdapter(type);

      // Sincronizar datos si es necesario
      if (
        type === "hybrid" &&
        this.firebaseAdapter &&
        this.localStorageAdapter
      ) {
        await this.syncData();
      }

      console.log(`Persistencia cambiada a: ${type}`);
      return true;
    } catch (error) {
      console.error("Error cambiando tipo de persistencia:", error);
      throw error;
    }
  }

  // Sincronizar datos entre adaptadores (modo híbrido)
  async syncData() {
    if (!this.firebaseAdapter || !this.localStorageAdapter) {
      throw new Error("Ambos adaptadores son necesarios para sincronización");
    }

    try {
      console.log("Sincronizando datos entre adaptadores...");

      // Obtener datos de ambos adaptadores
      const firebaseMemories = await this.firebaseAdapter.getMemories();
      const localMemories = await this.localStorageAdapter.getMemories();

      // Encontrar diferencias y sincronizar
      const syncResults = await this.mergeMemories(
        firebaseMemories,
        localMemories
      );

      console.log("Sincronización completada:", syncResults);
      return syncResults;
    } catch (error) {
      console.error("Error en sincronización:", error);
      throw error;
    }
  }

  // Fusionar memories de diferentes fuentes
  async mergeMemories(firebaseMemories, localMemories) {
    const results = {
      added: 0,
      updated: 0,
      conflicts: 0,
      errors: 0,
    };

    // Crear mapa de memories por ID único (tipo + posición)
    const memoryMap = new Map();

    // Procesar memories de Firebase
    firebaseMemories.forEach((memory) => {
      const key = `${memory.type}_${memory.position.x}_${memory.position.y}`;
      memoryMap.set(key, { ...memory, source: "firebase" });
    });

    // Procesar memories locales
    localMemories.forEach((memory) => {
      const key = `${memory.type}_${memory.position.x}_${memory.position.y}`;
      const existing = memoryMap.get(key);

      if (existing) {
        // Conflicto: decidir cuál es más reciente
        if (
          new Date(memory.updatedAt || memory.createdAt) >
          new Date(existing.updatedAt || existing.createdAt)
        ) {
          memoryMap.set(key, { ...memory, source: "local" });
          results.updated++;
        } else {
          results.conflicts++;
        }
      } else {
        // Nuevo memory local
        memoryMap.set(key, { ...memory, source: "local" });
        results.added++;
      }
    });

    // Sincronizar con Firebase
    for (const [key, memory] of memoryMap) {
      if (memory.source === "local") {
        try {
          await this.firebaseAdapter.createMemory(memory);
        } catch (error) {
          console.error(`Error sincronizando memory ${key}:`, error);
          results.errors++;
        }
      }
    }

    return results;
  }

  // Métodos delegados al adaptador activo
  async createMemory(memoryData) {
    if (!this.activeAdapter) {
      throw new Error("No hay adaptador activo");
    }

    try {
      const result = await this.activeAdapter.createMemory(memoryData);

      // En modo híbrido, también guardar en localStorage como backup
      if (PERSISTENCE_CONFIG.TYPE === "hybrid" && this.localStorageAdapter) {
        try {
          await this.localStorageAdapter.createMemory(memoryData);
        } catch (error) {
          console.warn("Error guardando en localStorage (backup):", error);
        }
      }

      return result;
    } catch (error) {
      // En modo híbrido, intentar guardar en localStorage si Firebase falla
      if (PERSISTENCE_CONFIG.TYPE === "hybrid" && this.localStorageAdapter) {
        console.warn("Firebase falló, guardando en localStorage:", error);
        return await this.localStorageAdapter.createMemory(memoryData);
      }
      throw error;
    }
  }

  async getMemories() {
    if (!this.activeAdapter) {
      throw new Error("No hay adaptador activo");
    }
    return await this.activeAdapter.getMemories();
  }

  async updateMemory(memoryId, updateData) {
    if (!this.activeAdapter) {
      throw new Error("No hay adaptador activo");
    }

    try {
      const result = await this.activeAdapter.updateMemory(
        memoryId,
        updateData
      );

      // En modo híbrido, también actualizar en localStorage
      if (PERSISTENCE_CONFIG.TYPE === "hybrid" && this.localStorageAdapter) {
        try {
          await this.localStorageAdapter.updateMemory(memoryId, updateData);
        } catch (error) {
          console.warn("Error actualizando en localStorage (backup):", error);
        }
      }

      return result;
    } catch (error) {
      // En modo híbrido, intentar actualizar en localStorage si Firebase falla
      if (PERSISTENCE_CONFIG.TYPE === "hybrid" && this.localStorageAdapter) {
        console.warn("Firebase falló, actualizando en localStorage:", error);
        return await this.localStorageAdapter.updateMemory(
          memoryId,
          updateData
        );
      }
      throw error;
    }
  }

  async deleteMemory(memoryId) {
    if (!this.activeAdapter) {
      throw new Error("No hay adaptador activo");
    }

    try {
      const result = await this.activeAdapter.deleteMemory(memoryId);

      // En modo híbrido, también eliminar de localStorage
      if (PERSISTENCE_CONFIG.TYPE === "hybrid" && this.localStorageAdapter) {
        try {
          await this.localStorageAdapter.deleteMemory(memoryId);
        } catch (error) {
          console.warn("Error eliminando de localStorage (backup):", error);
        }
      }

      return result;
    } catch (error) {
      // En modo híbrido, intentar eliminar de localStorage si Firebase falla
      if (PERSISTENCE_CONFIG.TYPE === "hybrid" && this.localStorageAdapter) {
        console.warn("Firebase falló, eliminando de localStorage:", error);
        return await this.localStorageAdapter.deleteMemory(memoryId);
      }
      throw error;
    }
  }

  async uploadImage(file, memoryId) {
    if (!this.activeAdapter) {
      throw new Error("No hay adaptador activo");
    }

    if (!this.activeAdapter.uploadImage) {
      throw new Error("El adaptador activo no soporta subida de imágenes");
    }

    return await this.activeAdapter.uploadImage(file, memoryId);
  }

  async deleteImage(imageId) {
    if (!this.activeAdapter) {
      throw new Error("No hay adaptador activo");
    }

    if (!this.activeAdapter.deleteImage) {
      throw new Error("El adaptador activo no soporta eliminación de imágenes");
    }

    return await this.activeAdapter.deleteImage(imageId);
  }

  // Callbacks
  onMemoriesUpdate(callback) {
    this.callbacks.onMemoriesUpdate = callback;
    if (this.activeAdapter) {
      this.activeAdapter.onMemoriesUpdate(callback);
    }
  }

  onMemorySelect(callback) {
    this.callbacks.onMemorySelect = callback;
    if (this.activeAdapter) {
      this.activeAdapter.onMemorySelect(callback);
    }
  }

  onMemoryDelete(callback) {
    this.callbacks.onMemoryDelete = callback;
    if (this.activeAdapter) {
      this.activeAdapter.onMemoryDelete(callback);
    }
  }

  onError(callback) {
    this.callbacks.onError = callback;
    if (this.activeAdapter) {
      this.activeAdapter.onError(callback);
    }
  }

  // Obtener información del adaptador activo
  getActiveAdapterInfo() {
    if (!this.activeAdapter) return null;

    return {
      type: PERSISTENCE_CONFIG.TYPE,
      name: this.activeAdapter.constructor.name,
      capabilities: this.activeAdapter.getCapabilities
        ? this.activeAdapter.getCapabilities()
        : [],
      status: this.activeAdapter.getStatus
        ? this.activeAdapter.getStatus()
        : "unknown",
    };
  }

  // Obtener estadísticas de uso
  async getUsageStats() {
    if (!this.activeAdapter) return null;

    const stats = await this.activeAdapter.getStats();

    return {
      adapter: this.getActiveAdapterInfo(),
      memories: stats,
      timestamp: new Date().toISOString(),
    };
  }

  // Limpiar recursos
  async destroy() {
    if (this.firebaseAdapter) {
      await this.firebaseAdapter.destroy();
    }

    if (this.localStorageAdapter) {
      await this.localStorageAdapter.destroy();
    }

    this.activeAdapter = null;
    this.isInitialized = false;
    this.callbacks = {
      onMemoriesUpdate: null,
      onMemorySelect: null,
      onMemoryDelete: null,
      onError: null,
    };
  }
}

export default PersistenceAdapter;
