// js/config.js
export const NIGHT_STORAGE_KEY = "pixelLifeNight";

// Tile base (pixel-art de 16px) escalado responsive
export let TILE_SRC_PX = 16;
export let TILE_SCALE = 3; // se recalcula en runtime
export let tileSize = TILE_SRC_PX * TILE_SCALE;

function computeScale() {
  const w = window.innerWidth;
  // Más contenido pero controlado: 48px (móvil), 64px (tablet/desktop)
  if (w <= 768) return 3; // 16*3 = 48
  return 4; // 16*4 = 64
}

export function recomputeTileSize() {
  TILE_SCALE = computeScale();
  tileSize = TILE_SRC_PX * TILE_SCALE;
}

// Función para detectar dispositivos móviles
function isMobileDevice() {
  // Detectar por ancho de pantalla (más confiable para responsive design)
  if (window.innerWidth <= 768) return true;

  // Detectar por User Agent como respaldo
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobileUA =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent.toLowerCase()
    );

  // Detectar por capacidades táctiles
  const hasTouchScreen =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Detectar por densidad de píxeles (dispositivos móviles suelen tener alta densidad)
  const pixelRatio = window.devicePixelRatio || 1;
  const isHighDensity = pixelRatio > 1.5;

  // Combinar múltiples indicadores para mayor precisión
  const mobileIndicators = [
    window.innerWidth <= 768, // Ancho de pantalla
    isMobileUA, // User Agent
    hasTouchScreen && isHighDensity, // Touch + alta densidad
    window.innerWidth < window.innerHeight && window.innerWidth <= 1024, // Orientación vertical + ancho limitado
  ];

  // Si al menos 2 indicadores sugieren móvil, considerarlo como tal
  return mobileIndicators.filter(Boolean).length >= 2;
}

const storedNight = (() => {
  try {
    return localStorage.getItem(NIGHT_STORAGE_KEY);
  } catch {
    return null;
  }
})();

// Detectar dispositivo y configurar nubes
const isMobile = isMobileDevice();
console.log(
  `📱 Device detection: ${isMobile ? "Mobile" : "Desktop"} (width: ${
    window.innerWidth
  }px)`
);
console.log(
  `🌤️ Clouds configuration: ${isMobile ? "Disabled" : "Enabled"} for ${
    isMobile ? "performance" : "visual effects"
  }`
);

export const CONFIG = {
  SHOW_GRID: false,
  SHOW_GRID_DURING_ANIM: false,
  SHOW_POIS: true,
  CRISP_ALIGN: true,
  ANIM_DURATION_MS: 1800, // Increased from 900ms to show both avatars walking together
  ANIM_SMOOTHING: true, // Enable ultra-smooth animation interpolation
  ANIM_IDLE: true,

  // Modo noche MANUAL (persistente)
  IS_NIGHT: storedNight ? storedNight === "1" : false,

  // Desactivar nubes en móviles para mejorar rendimiento
  CLOUDS: !isMobile,
};

// Función para actualizar configuración de nubes dinámicamente
export function updateCloudsConfig() {
  const newIsMobile = isMobileDevice();
  if (newIsMobile !== !CONFIG.CLOUDS) {
    CONFIG.CLOUDS = !newIsMobile;
    console.log(
      `🌤️ Clouds configuration updated: ${
        CONFIG.CLOUDS ? "Enabled" : "Disabled"
      } (width: ${window.innerWidth}px)`
    );
  }
}
