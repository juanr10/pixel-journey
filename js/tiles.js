import { TILE_SRC_PX, tileSize, CONFIG } from "./config.js";
import { seeded, mulberry32 } from "./utils.js";

const tilesetUrl = "./assets/tiles/tileset_pixel_life.png";
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

export function tileType(seed, x, y) {
  const r = seeded(seed, ((x + 1) * 73856093) ^ ((y + 1) * 19349663));
  if (r < 0.08) return 2; // agua
  if (r < 0.28) return 1; // bosque
  if (r < 0.4) return 3; // colina
  return 0; // llano
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

export function drawTiles(ctx, gridW, gridH, seed) {
  for (let x = 0; x < gridW; x++) {
    for (let y = 0; y < gridH; y++) {
      const t = tileType(seed, x, y);
      const index = t === 0 ? 0 : t === 1 ? 1 : t === 2 ? 2 : t === 3 ? 3 : 0;
      blitTile(ctx, index, x * tileSize, y * tileSize);
      if (t === 0) sprinkleGrass(ctx, x, y);
    }
  }
}
