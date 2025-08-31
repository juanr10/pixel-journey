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

const storedNight = (() => {
  try {
    return localStorage.getItem(NIGHT_STORAGE_KEY);
  } catch {
    return null;
  }
})();

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

  CLOUDS: true,
};
