export const NIGHT_STORAGE_KEY = "pixelLifeNight";

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
  ANIM_DURATION_MS: 900,
  ANIM_IDLE: true,

  // Modo noche MANUAL (persistente)
  IS_NIGHT: storedNight ? storedNight === "1" : false,

  CLOUDS: true,
};

// Tile base (pixel-art tileset 16px escalado a 48px)
export const TILE_SRC_PX = 16;
export const TILE_SCALE = 3;
export const tileSize = TILE_SRC_PX * TILE_SCALE;
