import { CONFIG, tileSize } from "./config.js";
import { clamp, easeInOut } from "./utils.js";
import { gridW, gridH, seed, memories, setGridH, cellCenter } from "./state.js";
import { tilesetReady, drawTiles } from "./tiles.js";
import { sprites } from "./sprites.js";
import { drawPOIAtCell } from "./poi.js";
import { computeWaypointsAndPolyline, drawPath } from "./path.js";
import { spawnSparkles, updateAndDrawSparkles } from "./particles.js";
import { updateClouds, drawClouds, getDayNightPhase } from "./clouds.js";

let canvas, ctx;

export function initCanvas() {
  canvas = document.getElementById("map");
  ctx = canvas.getContext("2d");
  setupCrispCanvas();
  return { canvas, ctx };
}

export function setupCrispCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const logicalW = gridW * tileSize;
  const logicalH = gridH * tileSize;
  canvas.style.width = logicalW + "px";
  canvas.style.height = logicalH + "px";
  canvas.width = Math.round(logicalW * dpr);
  canvas.height = Math.round(logicalH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

export function drawNightOverlay(tSec) {
  if (!CONFIG.DAY_NIGHT) return;
  const nightness = getDayNightPhase(tSec);
  const maxAlpha = 0.55;
  const alpha = nightness * maxAlpha;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#0b1b3a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (nightness > 0.2) {
    const starCount = Math.min(120, Math.floor((nightness - 0.2) * 200));
    const rnd = ((a) => () => {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    })(0xa5f42c91);
    for (let i = 0; i < starCount; i++) {
      const x = Math.floor(rnd() * canvas.width);
      const y = Math.floor(rnd() * canvas.height);
      const tw = (Math.sin(tSec * 3 + i * 0.37) + 1) / 2;
      const a = 0.25 + tw * 0.55;
      ctx.save();
      ctx.globalAlpha = a * (0.4 + 0.6 * nightness);
      ctx.fillStyle = "#fff8c4";
      if (rnd() < 0.2) {
        ctx.fillRect(x - 1, y, 1, 1);
        ctx.fillRect(x + 1, y, 1, 1);
        ctx.fillRect(x, y - 1, 1, 1);
        ctx.fillRect(x, y + 1, 1, 1);
        ctx.fillRect(x, y, 1, 1);
      } else ctx.fillRect(x, y, 1, 1);
      ctx.restore();
    }
  }
}

export function ensureCapacity() {
  const { waypoints } = computeWaypointsAndPolyline(memories, seed, gridW);
  const lastY = waypoints.length ? waypoints[waypoints.length - 1].y : 0;
  setGridH(Math.max(12, lastY + 4));
  setupCrispCanvas();
}

function drawHouseAndAvatars(tSec = 0) {
  const bobJuan = Math.round(Math.sin(tSec * 2.0) * 2);
  const bobPaula = Math.round(Math.sin(tSec * 2.0 + Math.PI / 2) * 2);
  ctx.drawImage(sprites.house, 0, 0, tileSize, tileSize);
  if (gridW >= 3) {
    ctx.drawImage(sprites.juan, tileSize, 0 + bobJuan, tileSize, tileSize);
    ctx.drawImage(
      sprites.paula,
      tileSize * 2,
      0 + bobPaula,
      tileSize,
      tileSize
    );
  }
}

function drawIconScaled(img, cx, cy, baseSize, scale = 1) {
  const w = Math.round(baseSize * scale);
  const h = Math.round(baseSize * scale);
  const dx = Math.round(cx - w / 2);
  const dy = Math.round(cy - h / 2);
  ctx.drawImage(img, dx, dy, w, h);
}

function drawIcons(waypoints, uptoIdx = waypoints.length - 1, tSec = 0) {
  const baseSize = Math.round(tileSize * 0.73);
  for (let k = 0; k <= uptoIdx && k < waypoints.length; k++) {
    const w = waypoints[k];
    const m = memories[w.idx];
    const icon = sprites[m.type] ?? sprites.camera;
    const bob = Math.round(Math.sin(tSec * 2 + k * 0.7) * 2);
    const cx = w.x * tileSize + 8 + baseSize / 2;
    const cy = w.y * tileSize + 8 + baseSize / 2 + bob;
    drawIconScaled(icon, cx, cy, baseSize, 1);
    drawPOIAtCell(ctx, w.x, w.y, m.type, tSec);
  }
}

export function drawStatic(tSec = 0) {
  const { waypoints, polyline } = computeWaypointsAndPolyline(
    memories,
    seed,
    gridW
  );
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTiles(ctx, gridW, gridH, seed);
  drawPath(ctx, polyline);
  drawNightOverlay(tSec);
  return { waypoints, polyline };
}

export function drawIdleFrame(tSec, dt = 0) {
  const { waypoints } = computeWaypointsAndPolyline(memories, seed, gridW);
  drawHouseAndAvatars(tSec);
  drawIcons(waypoints, waypoints.length - 1, tSec);
  updateAndDrawSparkles(ctx, dt);
  // nubes encima de todo
  drawClouds(ctx, tSec);
}

export function drawMap(tSec = 0) {
  drawStatic(tSec);
  drawHouseAndAvatars(tSec);
  const { waypoints } = computeWaypointsAndPolyline(memories, seed, gridW);
  drawIcons(waypoints, waypoints.length - 1, tSec);
  drawClouds(ctx, tSec);
}

function countWaypointsVisible(polyline, uptoIdx) {
  const { waypoints } = computeWaypointsAndPolyline(memories, seed, gridW);
  let visible = -1;
  for (let k = 0; k < waypoints.length; k++) {
    const w = waypoints[k];
    const c = cellCenter(w.x, w.y);
    for (let i = 0; i <= uptoIdx; i++) {
      const p = polyline[i];
      if (Math.hypot(p.x - c.x, p.y - c.y) < 1e-3) {
        visible = k;
        break;
      }
    }
  }
  return visible;
}

export function animateLastSegment() {
  const { waypoints, polyline } = computeWaypointsAndPolyline(
    memories,
    seed,
    gridW
  );
  if (waypoints.length === 0) {
    drawMap();
    return;
  }

  let prevEnd = 1;
  if (memories.length > 1) {
    const prevMems = memories.slice(0, memories.length - 1);
    const keep = memories;
    // simular polilínea previa para saber hasta dónde existía
    const old = computeWaypointsAndPolyline(prevMems, seed, gridW);
    prevEnd = old.polyline.length - 1;
  }
  const totalEnd = polyline.length - 1;
  const DURATION = CONFIG.ANIM_DURATION_MS;
  let start = null;
  let sparkSpawned = false;

  let lastTs = null;
  function render(progressIdx, tSec, dt) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTiles(ctx, gridW, gridH, seed);
    drawPath(ctx, polyline, progressIdx);
    drawNightOverlay(tSec);

    const visibleWp = countWaypointsVisible(polyline, progressIdx);
    const wps = computeWaypointsAndPolyline(memories, seed, gridW).waypoints;
    const baseSize = Math.round(tileSize * 0.73);

    drawHouseAndAvatars(tSec);

    for (let k = 0; k <= visibleWp; k++) {
      const w = wps[k];
      const m = memories[w.idx];
      const icon = sprites[m.type] ?? sprites.camera;

      const bob = Math.round(Math.sin(tSec * 2 + k * 0.7) * 2);
      const cx = w.x * tileSize + 8 + baseSize / 2;
      const cy = w.y * tileSize + 8 + baseSize / 2 + bob;

      let scale = 1;
      if (k === visibleWp) {
        const prog = (progressIdx - prevEnd) / Math.max(1, totalEnd - prevEnd);
        const popPhase = clamp((prog - 0.7) / 0.3, 0, 1);
        scale = 0.9 + 0.1 * easeInOut(popPhase);
        if (!sparkSpawned && popPhase > 0.05) {
          sparkSpawned = true;
          spawnSparkles(cx, cy, seed, 20);
        }
      }
      drawIconScaled(icon, cx, cy, baseSize, scale);
      drawPOIAtCell(ctx, w.x, w.y, m.type, tSec);
    }

    // avatar viajero opcional
    const a = polyline[progressIdx];
    if (sprites.juan && sprites.juan.width) {
      ctx.drawImage(
        sprites.juan,
        Math.round(a.x - 16),
        Math.round(a.y - 16),
        32,
        32
      );
    } else {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(Math.round(a.x), Math.round(a.y), 5, 0, Math.PI * 2);
      ctx.fill();
    }

    updateAndDrawSparkles(ctx, dt);
    drawClouds(ctx, tSec);
  }

  function step(ts) {
    if (!start) start = ts;
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    updateClouds(dt, canvas);

    const t = Math.min(1, (ts - start) / DURATION);
    const eased = easeInOut(t);
    const idx = Math.max(
      prevEnd,
      Math.min(totalEnd, Math.floor(prevEnd + eased * (totalEnd - prevEnd)))
    );
    render(idx, ts / 1000, dt);
    if (t < 1) requestAnimationFrame(step);
    else drawMap(ts / 1000);
  }
  requestAnimationFrame(step);
}

export function focusLastWaypointIfBelowView() {
  const { waypoints } = computeWaypointsAndPolyline(memories, seed, gridW);
  if (waypoints.length === 0) return;
  const last = waypoints[waypoints.length - 1];
  const center = cellCenter(last.x, last.y);
  const canvasTopPage = canvas.getBoundingClientRect().top + window.scrollY;
  const waypointYInPage = canvasTopPage + center.y;
  const viewTop = window.scrollY;
  const viewBottom = viewTop + window.innerHeight;
  const margin = tileSize * 1.5;
  if (waypointYInPage > viewBottom - margin) {
    const targetY = Math.max(
      0,
      Math.round(waypointYInPage - window.innerHeight / 2)
    );
    window.scrollTo({ top: targetY, behavior: "smooth" });
  }
}

let idleRAF = null;
let lastIdleTs = null;

export function startIdleLoop() {
  if (!CONFIG.ANIM_IDLE) return;
  if (idleRAF) cancelAnimationFrame(idleRAF);
  idleRAF = requestAnimationFrame(idleFrame);
}

function idleFrame(ts) {
  if (!CONFIG.ANIM_IDLE) return;
  const tSec = ts / 1000;
  if (!lastIdleTs) lastIdleTs = ts;
  const dt = (ts - lastIdleTs) / 1000;
  lastIdleTs = ts;

  updateClouds(dt, canvas);
  drawStatic(tSec);
  drawIdleFrame(tSec, dt);
  idleRAF = requestAnimationFrame(idleFrame);
}

export function getCanvas() {
  return canvas;
}
export function getCtx() {
  return ctx;
}
