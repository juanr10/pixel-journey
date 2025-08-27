import { CONFIG } from "./config.js";
import { clamp, mulberry32, strToSeed } from "./utils.js";

export const Clouds = {
  layers: [],
  ready: false,
  spriteSmall: null,
  spriteBig: null,
  scrollY: 0,
};

function makeCloudSprite(width, height, seedVal) {
  const hiResScale = 3;
  const offHR = document.createElement("canvas");
  offHR.width = width * hiResScale;
  offHR.height = height * hiResScale;
  const cx = offHR.getContext("2d");
  cx.imageSmoothingEnabled = true;

  const rnd = mulberry32(seedVal >>> 0);

  // Lóbulos arriba y abajo
  cx.fillStyle = "#ffffff";
  const lobes = 4 + Math.floor(rnd() * 3);
  const baseY = Math.floor(offHR.height * 0.55);
  let centerX = Math.floor(offHR.width * 0.2 + rnd() * offHR.width * 0.2);

  // superiores
  for (let i = 0; i < lobes; i++) {
    const r = Math.floor(offHR.height * (0.12 + rnd() * 0.18));
    const cy = baseY - Math.floor(rnd() * offHR.height * 0.18);
    cx.beginPath();
    cx.arc(centerX, cy, r, 0, Math.PI * 2);
    cx.fill();
    centerX += Math.floor(r * 0.95);
  }
  // inferiores
  for (let i = 0; i < Math.floor(lobes / 2) + 2; i++) {
    const r = Math.floor(offHR.height * (0.1 + rnd() * 0.15));
    const cxPos = 8 + Math.floor(rnd() * (offHR.width - 16));
    const cyPos = baseY + Math.floor(rnd() * (offHR.height * 0.25));
    cx.beginPath();
    cx.arc(cxPos, cyPos, r, 0, Math.PI * 2);
    cx.fill();
  }

  // sombreado inferior leve
  const grad = cx.createLinearGradient(0, baseY, 0, offHR.height);
  grad.addColorStop(0.0, "rgba(234,234,234,0.0)");
  grad.addColorStop(1.0, "rgba(234,234,234,0.9)");
  cx.globalCompositeOperation = "source-atop";
  cx.fillStyle = grad;
  cx.fillRect(0, baseY, offHR.width, offHR.height - baseY);
  cx.globalCompositeOperation = "source-over";

  // reducir suavizando
  const off = document.createElement("canvas");
  off.width = width;
  off.height = height;
  const c2 = off.getContext("2d");
  c2.imageSmoothingEnabled = true;
  c2.drawImage(offHR, 0, 0, off.width, off.height);
  return off;
}

export function initClouds(canvas) {
  if (!CONFIG.CLOUDS) return;
  Clouds.spriteSmall = makeCloudSprite(36, 18, strToSeed("CLOUDS_SMALL"));
  Clouds.spriteBig = makeCloudSprite(60, 28, strToSeed("CLOUDS_BIG"));

  const w = canvas.width,
    h = canvas.height;
  const far = [];
  for (let i = 0; i < 6; i++) {
    far.push({
      x: Math.floor(Math.random() * w),
      y: 20 + i * Math.floor(h / 10) + Math.floor(Math.random() * 8),
      speed: 8,
      scale: 3,
      sprite: i % 2 === 0 ? Clouds.spriteSmall : Clouds.spriteBig,
      vyFactor: 0.04,
    });
  }
  const near = [];
  for (let i = 0; i < 5; i++) {
    near.push({
      x: Math.floor(Math.random() * w),
      y: 40 + i * Math.floor(h / 9) + Math.floor(Math.random() * 12),
      speed: 18,
      scale: 3,
      sprite: i % 2 === 0 ? Clouds.spriteBig : Clouds.spriteSmall,
      vyFactor: 0.08,
    });
  }
  Clouds.layers = [far, near];
  Clouds.ready = true;
}

export function updateClouds(dt, canvas) {
  if (!CONFIG.CLOUDS || !Clouds.ready) return;
  const w = canvas.width;
  Clouds.layers.forEach((layer) => {
    layer.forEach((c) => {
      c.x += c.speed * dt;
      const sw = c.sprite.width * c.scale;
      if (c.x - sw > w) c.x = -sw;
    });
  });
}

export function drawClouds(ctx, tSec) {
  if (!CONFIG.CLOUDS || !Clouds.ready) return;
  const nightness = CONFIG.DAY_NIGHT ? getDayNightPhase(tSec) : 0;
  const dayAlpha = clamp(1 - nightness * 1.6, 0, 1);

  const prevSmooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;

  ctx.save();
  ctx.globalAlpha = dayAlpha * 0.6;
  Clouds.layers.forEach((layer) => {
    layer.forEach((c) => {
      const dw = c.sprite.width * c.scale;
      const dh = c.sprite.height * c.scale;
      const parallaxY = Clouds.scrollY * c.vyFactor;
      const dx = Math.round(c.x);
      const dy = Math.round(c.y + parallaxY);
      ctx.drawImage(c.sprite, dx, dy, dw, dh);
    });
  });
  ctx.restore();

  ctx.imageSmoothingEnabled = prevSmooth;
}

export function bindScrollParallax() {
  let lastScrollSent = 0;
  window.addEventListener("scroll", () => {
    const now = performance.now();
    if (now - lastScrollSent > 16) {
      Clouds.scrollY = window.scrollY;
      lastScrollSent = now;
    }
  });
}

// reutilizamos el cálculo de fase desde aquí para nubes
export function getDayNightPhase(tSec) {
  const T = CONFIG.DAY_NIGHT_SECONDS;
  const phi = (tSec % T) / T;
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * phi); // 0..1
}
