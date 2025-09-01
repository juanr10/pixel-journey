// js/firebase/firebase-adapter.js
// Adaptador de Firebase que implementa la misma interfaz que localStorage

import {
  getFirebaseConfig,
  getImageConfig,
} from "../config/persistence-config.js";

// Singleton instance
let firebaseSingletonInstance = null;

export class FirebaseAdapter {
  constructor() {
    // Singleton pattern - solo una instancia
    if (firebaseSingletonInstance) {
      return firebaseSingletonInstance;
    }

    this.config = getFirebaseConfig();
    this.imageConfig = getImageConfig();
    this.db = null;
    this.storage = null;
    this.isInitialized = false;
    this.unsubscribe = null;
    this.callbacks = {
      onMemoriesUpdate: null,
      onMemorySelect: null,
      onMemoryDelete: null,
      onError: null,
    };

    // Guardar la instancia singleton
    firebaseSingletonInstance = this;
  }

  // Inicializar el adaptador
  async init() {
    // Si ya está inicializado, no hacer nada
    if (this.isInitialized) {
      console.log("FirebaseAdapter ya está inicializado");
      return;
    }

    try {
      // Importar Firebase dinámicamente
      const { initializeApp } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
      );
      const {
        getFirestore,
        collection,
        addDoc,
        getDocs,
        getDoc,
        updateDoc,
        deleteDoc,
        doc,
        query,
        orderBy,
        onSnapshot,
      } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
      );
      const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } =
        await import(
          "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js"
        );

      // Inicializar Firebase
      const app = initializeApp(this.config);
      this.db = getFirestore(app);
      this.storage = getStorage(app);

      // Guardar referencias a las funciones
      this.firestoreFunctions = {
        collection,
        addDoc,
        getDocs,
        getDoc,
        updateDoc,
        deleteDoc,
        doc,
        query,
        orderBy,
        onSnapshot,
      };

      this.storageFunctions = {
        ref,
        uploadBytes,
        getDownloadURL,
        deleteObject,
      };

      this.isInitialized = true;
      console.log("FirebaseAdapter initialized successfully");
    } catch (error) {
      console.error("Error initializing FirebaseAdapter:", error);
      throw error;
    }
  }

  // Crear nuevo memory
  async createMemory(memoryData) {
    try {
      const { collection, addDoc } = this.firestoreFunctions;

      const docRef = await addDoc(collection(this.db, "memories"), {
        ...memoryData,
        userId: "default_user",
        images: memoryData.images || [],
        metadata: memoryData.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log("Memory created in Firebase:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating memory in Firebase:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Obtener todos los memories
  async getMemories() {
    try {
      const { collection, query, orderBy, getDocs } = this.firestoreFunctions;

      const q = query(
        collection(this.db, "memories"),
        orderBy("createdAt", "asc") // Cambiar a "asc" para orden cronológico
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting memories from Firebase:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Obtener memory por ID
  async getMemoryById(memoryId) {
    try {
      const { doc, getDoc } = this.firestoreFunctions;

      const docRef = doc(this.db, "memories", memoryId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Error getting memory from Firebase:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Actualizar memory
  async updateMemory(memoryId, updateData) {
    try {
      const { doc, updateDoc } = this.firestoreFunctions;

      const memoryRef = doc(this.db, "memories", memoryId);
      await updateDoc(memoryRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

      console.log("Memory updated in Firebase:", memoryId);
    } catch (error) {
      console.error("Error updating memory in Firebase:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Eliminar memory
  async deleteMemory(memoryId) {
    try {
      const { doc, deleteDoc } = this.firestoreFunctions;

      // Primero eliminar todas las imágenes del storage
      const memory = await this.getMemoryById(memoryId);
      if (memory && memory.images) {
        for (const image of memory.images) {
          await this.deleteImage(image.id, memoryId);
        }
      }

      // Luego eliminar el documento
      await deleteDoc(doc(this.db, "memories", memoryId));

      console.log("Memory deleted from Firebase:", memoryId);
    } catch (error) {
      console.error("Error deleting memory from Firebase:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Subir imagen
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

      // Comprimir imagen antes de subir
      const compressedFile = await this.compressImage(file);

      // Crear referencia única para la imagen
      const imageId = `img_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const { ref } = this.storageFunctions;
      const storageRef = ref(this.storage, `memories/${memoryId}/${imageId}`);

      // Subir archivo comprimido
      const { uploadBytes, getDownloadURL } = this.storageFunctions;
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Crear objeto de imagen
      const imageData = {
        id: imageId,
        url: downloadURL,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        metadata: {
          size: compressedFile.size,
          type: compressedFile.type,
          originalSize: file.size,
          storage: "firebase",
        },
      };

      console.log("Image uploaded to Firebase:", imageData.id);
      return imageData;
    } catch (error) {
      console.error("Error uploading image to Firebase:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Eliminar imagen
  async deleteImage(imageId, memoryId = null) {
    try {
      const { ref, deleteObject } = this.storageFunctions;

      // Si no se proporciona memoryId, intentar encontrarlo
      if (!memoryId) {
        memoryId = await this.findMemoryIdByImageId(imageId);
        if (!memoryId) {
          throw new Error(
            `No se pudo encontrar el memoryId para la imagen: ${imageId}`
          );
        }
      }

      const imageRef = ref(this.storage, `memories/${memoryId}/${imageId}`);
      await deleteObject(imageRef);

      console.log(
        "Image deleted from Firebase:",
        imageId,
        "from memory:",
        memoryId
      );
    } catch (error) {
      console.error("Error deleting image from Firebase:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Buscar memoryId basado en imageId
  async findMemoryIdByImageId(imageId) {
    try {
      const { collection, query, where, getDocs } = this.firestoreFunctions;

      // Buscar en todos los memories que tengan esta imagen
      const memoriesRef = collection(this.db, "memories");
      const q = query(
        memoriesRef,
        where("images", "array-contains", { id: imageId })
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const memoryDoc = querySnapshot.docs[0];
        return memoryDoc.id;
      }

      return null;
    } catch (error) {
      console.error("Error finding memoryId by imageId:", error);
      return null;
    }
  }

  // Añadir path a memory
  async addPathToMemory(memoryId, pathData) {
    try {
      const { collection, addDoc } = this.firestoreFunctions;

      const pathRef = await addDoc(collection(this.db, "paths"), {
        ...pathData,
        memoryId,
        userId: "default_user",
        createdAt: new Date().toISOString(),
      });

      console.log("Path added to Firebase:", pathRef.id);
      return pathRef.id;
    } catch (error) {
      console.error("Error adding path to Firebase:", error);
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

  // Suscribirse a cambios en tiempo real
  subscribeToMemories(callback) {
    try {
      const { collection, query, orderBy, onSnapshot } =
        this.firestoreFunctions;

      const q = query(
        collection(this.db, "memories"),
        orderBy("createdAt", "desc")
      );
      this.unsubscribe = onSnapshot(q, (querySnapshot) => {
        const memories = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(memories);
      });

      return this.unsubscribe;
    } catch (error) {
      console.error("Error subscribing to memories:", error);
      this.notifyError(error);
      throw error;
    }
  }

  // Obtener memories por tipo
  async getMemoriesByType(type) {
    try {
      const memories = await this.getMemories();
      return memories.filter((m) => m.type === type);
    } catch (error) {
      console.error("Error getting memories by type:", error);
      throw error;
    }
  }

  // Obtener memories por posición
  async getMemoriesNearPosition(x, y, radius = 2) {
    try {
      const memories = await this.getMemories();
      return memories.filter((memory) => {
        const dx = Math.abs(memory.position.x - x);
        const dy = Math.abs(memory.position.y - y);
        return dx <= radius && dy <= radius;
      });
    } catch (error) {
      console.error("Error getting memories near position:", error);
      throw error;
    }
  }

  // Buscar memories
  async searchMemories(query) {
    try {
      const memories = await this.getMemories();
      const searchTerm = query.toLowerCase();

      return memories.filter(
        (memory) =>
          memory.title?.toLowerCase().includes(searchTerm) ||
          memory.description?.toLowerCase().includes(searchTerm) ||
          memory.type.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error("Error searching memories:", error);
      throw error;
    }
  }

  // Obtener estadísticas
  async getStats() {
    try {
      const memories = await this.getMemories();

      const stats = {
        total: memories.length,
        byType: {},
        withImages: 0,
        withPaths: 0,
        totalImages: 0,
      };

      memories.forEach((memory) => {
        // Contar por tipo
        stats.byType[memory.type] = (stats.byType[memory.type] || 0) + 1;

        // Contar con imágenes
        if (memory.images && memory.images.length > 0) {
          stats.withImages++;
          stats.totalImages += memory.images.length;
        }
      });

      return stats;
    } catch (error) {
      console.error("Error getting stats:", error);
      throw error;
    }
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
      "realtime_sync",
      "cloud_storage",
    ];
  }

  // Obtener estado del adaptador
  getStatus() {
    return {
      initialized: this.isInitialized,
      connected: this.isInitialized && this.db !== null,
      storage: this.storage !== null,
      lastSync: new Date().toISOString(),
    };
  }

  // Guardar estado (para sincronización)
  async saveState() {
    // Firebase no necesita guardar estado manualmente
    return true;
  }

  // Callbacks
  onMemoriesUpdate(callback) {
    this.callbacks.onMemoriesUpdate = callback;
    // Configurar suscripción en tiempo real
    if (this.isInitialized) {
      this.subscribeToMemories(callback);
    }
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
  notifyMemoriesUpdate(memories) {
    if (this.callbacks.onMemoriesUpdate) {
      this.callbacks.onMemoriesUpdate(memories);
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
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }

      this.db = null;
      this.storage = null;
      this.isInitialized = false;
      this.callbacks = {
        onMemoriesUpdate: null,
        onMemorySelect: null,
        onMemoryDelete: null,
        onError: null,
      };

      console.log("FirebaseAdapter destroyed");
    } catch (error) {
      console.error("Error destroying FirebaseAdapter:", error);
    }
  }
}

export default FirebaseAdapter;
