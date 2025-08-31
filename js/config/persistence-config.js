// js/config/persistence-config.js
// Configuración centralizada para el sistema de persistencia

export const PERSISTENCE_CONFIG = {
  // Tipo de persistencia: 'localStorage' | 'firebase' | 'hybrid'
  TYPE: import.meta.env?.VITE_PERSISTENCE_TYPE || "localStorage",

  // Configuración de Firebase
  FIREBASE: {
    // Credenciales desde variables de entorno
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env?.VITE_FIREBASE_APP_ID || "",
  },

  // Configuración de localStorage
  LOCAL_STORAGE: {
    // Claves para localStorage
    MEMORIES_KEY: "pixelLife_memories",
    PATHS_KEY: "pixelLife_paths",
    SETTINGS_KEY: "pixelLife_settings",
  },

  // Configuración de imágenes
  IMAGES: {
    // Tamaño máximo de imagen (píxeles)
    MAX_SIZE: parseInt(import.meta.env?.VITE_MAX_IMAGE_SIZE) || 800,
    // Calidad de compresión (0.1 - 1.0)
    QUALITY: parseFloat(import.meta.env?.VITE_IMAGE_QUALITY) || 0.8,
    // Tamaño máximo de archivo (bytes)
    MAX_FILE_SIZE:
      parseInt(import.meta.env?.VITE_MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    // Formatos soportados
    SUPPORTED_FORMATS: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },

  // Configuración de sincronización
  SYNC: {
    // Habilitar sincronización automática
    ENABLED: import.meta.env?.VITE_SYNC_ENABLED !== "false",
    // Intervalo de sincronización (ms)
    INTERVAL: parseInt(import.meta.env?.VITE_SYNC_INTERVAL) || 30000, // 30s
    // Habilitar sincronización en tiempo real (solo Firebase)
    REALTIME: import.meta.env?.VITE_REALTIME_SYNC !== "false",
  },

  // Configuración de migración
  MIGRATION: {
    // Habilitar migración automática
    ENABLED: import.meta.env?.VITE_MIGRATION_ENABLED !== "false",
    // Mantener datos locales después de migración
    KEEP_LOCAL: import.meta.env?.VITE_KEEP_LOCAL_DATA === "true",
  },

  // Configuración de desarrollo
  DEV: {
    // Modo debug
    DEBUG: import.meta.env?.VITE_DEBUG === "true",
    // Logs detallados
    VERBOSE: import.meta.env?.VITE_VERBOSE === "true",
    // Simular latencia de red (ms)
    NETWORK_LATENCY: parseInt(import.meta.env?.VITE_NETWORK_LATENCY) || 0,
  },
};

// Función para validar configuración
export function validateConfig() {
  const errors = [];

  // Validar tipo de persistencia
  if (
    !["localStorage", "firebase", "hybrid"].includes(PERSISTENCE_CONFIG.TYPE)
  ) {
    errors.push(`Tipo de persistencia inválido: ${PERSISTENCE_CONFIG.TYPE}`);
  }

  // Validar configuración de Firebase si es necesario
  if (
    PERSISTENCE_CONFIG.TYPE === "firebase" ||
    PERSISTENCE_CONFIG.TYPE === "hybrid"
  ) {
    const requiredFields = ["apiKey", "projectId", "storageBucket"];
    requiredFields.forEach((field) => {
      if (!PERSISTENCE_CONFIG.FIREBASE[field]) {
        errors.push(`Campo Firebase requerido: ${field}`);
      }
    });
  }

  // Validar configuración de imágenes
  if (
    PERSISTENCE_CONFIG.IMAGES.MAX_SIZE < 100 ||
    PERSISTENCE_CONFIG.IMAGES.MAX_SIZE > 2000
  ) {
    errors.push("MAX_IMAGE_SIZE debe estar entre 100 y 2000 píxeles");
  }

  if (
    PERSISTENCE_CONFIG.IMAGES.QUALITY < 0.1 ||
    PERSISTENCE_CONFIG.IMAGES.QUALITY > 1.0
  ) {
    errors.push("IMAGE_QUALITY debe estar entre 0.1 y 1.0");
  }

  return errors;
}

// Función para obtener configuración según el entorno
export function getConfigForEnvironment(environment = "development") {
  const configs = {
    development: {
      TYPE: "localStorage",
      DEBUG: true,
      VERBOSE: true,
    },
    staging: {
      TYPE: "hybrid",
      DEBUG: true,
      VERBOSE: false,
    },
    production: {
      TYPE: "firebase",
      DEBUG: false,
      VERBOSE: false,
      SYNC: { ENABLED: true, REALTIME: true },
    },
  };

  return { ...PERSISTENCE_CONFIG, ...configs[environment] };
}

// Función para verificar si Firebase está disponible
export function isFirebaseAvailable() {
  return (
    PERSISTENCE_CONFIG.TYPE === "firebase" ||
    PERSISTENCE_CONFIG.TYPE === "hybrid"
  );
}

// Función para verificar si localStorage está disponible
export function isLocalStorageAvailable() {
  return (
    PERSISTENCE_CONFIG.TYPE === "localStorage" ||
    PERSISTENCE_CONFIG.TYPE === "hybrid"
  );
}

// Función para obtener el tipo de persistencia activo
export function getActivePersistenceType() {
  return PERSISTENCE_CONFIG.TYPE;
}

// Función para cambiar el tipo de persistencia en runtime
export function setPersistenceType(type) {
  if (["localStorage", "firebase", "hybrid"].includes(type)) {
    PERSISTENCE_CONFIG.TYPE = type;
    console.log(`Tipo de persistencia cambiado a: ${type}`);
    return true;
  }
  console.error(`Tipo de persistencia inválido: ${type}`);
  return false;
}

// Función para obtener configuración de Firebase
export function getFirebaseConfig() {
  if (!isFirebaseAvailable()) {
    throw new Error("Firebase no está disponible en la configuración actual");
  }
  return PERSISTENCE_CONFIG.FIREBASE;
}

// Función para obtener configuración de localStorage
export function getLocalStorageConfig() {
  if (!isLocalStorageAvailable()) {
    throw new Error(
      "localStorage no está disponible en la configuración actual"
    );
  }
  return PERSISTENCE_CONFIG.LOCAL_STORAGE;
}

// Función para obtener configuración de imágenes
export function getImageConfig() {
  return PERSISTENCE_CONFIG.IMAGES;
}

// Función para obtener configuración de sincronización
export function getSyncConfig() {
  return PERSISTENCE_CONFIG.SYNC;
}

// Función para obtener configuración de desarrollo
export function getDevConfig() {
  return PERSISTENCE_CONFIG.DEV;
}

// Función para debug de configuración
export function debugConfig() {
  if (PERSISTENCE_CONFIG.DEV.DEBUG) {
    console.group("🔧 Configuración de Persistencia");
    console.log("Tipo:", PERSISTENCE_CONFIG.TYPE);
    console.log("Firebase disponible:", isFirebaseAvailable());
    console.log("localStorage disponible:", isLocalStorageAvailable());
    console.log("Configuración completa:", PERSISTENCE_CONFIG);
    console.groupEnd();
  }
}

// Exportar configuración por defecto
export default PERSISTENCE_CONFIG;
