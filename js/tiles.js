// js/tiles.js
import { TILE_SRC_PX, tileSize, CONFIG } from "./config.js";
import { seeded, mulberry32 } from "./utils.js";
// Importar el tileset para que Vite lo incluya en el build
import tilesetUrl from "../assets/tiles/tileset_pixel_life.png";

let tilesetImg = new Image();
let tilesetLoaded = false;

export function loadTileset() {
  return new Promise((resolve) => {
    tilesetImg.onload = () => {
      tilesetLoaded = true;
      resolve();
    };
    tilesetImg.onerror = () => {
      tilesetLoaded = false;
      resolve();
    };
    tilesetImg.src = tilesetUrl;
  });
}
export function tilesetReady() {
  return tilesetLoaded;
}

export function blitTile(ctx, tileIndex, dx, dy) {
  if (!tilesetReady()) return;
  const sx = tileIndex * TILE_SRC_PX,
    sy = 0;
  const sw = TILE_SRC_PX,
    sh = TILE_SRC_PX;
  const dw = tileSize,
    dh = tileSize;
  const px = CONFIG.CRISP_ALIGN ? Math.round(dx) : dx;
  const py = CONFIG.CRISP_ALIGN ? Math.round(dy) : dy;
  ctx.drawImage(tilesetImg, sx, sy, sw, sh, px, py, dw, dh);
}

// 0: llano (pradera), 1: bosque, 2: agua, 3: colina
export function baseTileType(seed, x, y) {
  const r = seeded(seed, ((x + 1) * 73856093) ^ ((y + 1) * 19349663));
  if (r < 0.08) return 2; // agua
  if (r < 0.28) return 1; // bosque
  if (r < 0.4) return 3; // colina
  return 0; // llano
}

/**
 * Dibuja el mundo, evitando agua en celdas protegidas (mask).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} gridW
 * @param {number} gridH
 * @param {number} seed
 * @param {Set<string>} noWaterMask  keys "x,y" para forzar tierra
 */
export function drawTiles(ctx, gridW, gridH, seed, noWaterMask = new Set()) {
  for (let x = 0; x < gridW; x++) {
    for (let y = 0; y < gridH; y++) {
      let t = baseTileType(seed, x, y);

      // Forzar tierra si la celda está protegida
      if (noWaterMask.has(`${x},${y}`)) {
        if (t === 2) t = 0; // agua -> llano
      }

      const index = t === 0 ? 0 : t === 1 ? 1 : t === 2 ? 2 : t === 3 ? 3 : 0;
      blitTile(ctx, index, x * tileSize, y * tileSize);

      // Un pelín de “hierba” en llanos para textura
      if (t === 0) sprinkleGrass(ctx, x, y);
    }
  }
}

export function sprinkleGrass(ctx, x, y) {
  const baseX = x * tileSize,
    baseY = y * tileSize;
  const rnd = mulberry32((((x + 13) * 9973) ^ ((y + 17) * 7919)) >>> 0);
  const dots = 3 + Math.floor(rnd() * 4);
  for (let i = 0; i < dots; i++) {
    const px = baseX + 2 + Math.floor(rnd() * (tileSize - 4));
    const py = baseY + 2 + Math.floor(rnd() * (tileSize - 4));
    ctx.fillStyle = rnd() < 0.5 ? "#49a84a" : "#53b94f";
    ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
}
