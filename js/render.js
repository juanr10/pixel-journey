// js/render.js
// Updated animation: Both avatars (Juan and Paula) now walk together when creating memories
// Animation duration increased from 900ms to 1800ms for better visual experience
// Ultra-smooth animation with interpolation and optimized frame rate
// Sparkles now spawn exactly when the new memory icon is fully visible
import { CONFIG, tileSize, spriteSize, houseSize } from "./config.js";
import { clamp, easeInOut } from "./utils.js";
import { gridW, gridH, seed, memories, setGridH, cellCenter } from "./state.js";
import { drawTiles } from "./tiles.js";
import { sprites } from "./sprites.js";
import { drawPOIAtCell } from "./poi.js";
import { computeWaypointsAndPolyline, HOUSE_COL, HOUSE_ROW } from "./path.js";
import { spawnSparkles, updateAndDrawSparkles } from "./particles.js";
import { updateClouds, drawClouds } from "./clouds.js";

let canvas = null;
let ctx = null;

// ========= Canvas =========
export function initCanvas() {
  canvas = document.getElementById("map");
  ctx = canvas.getContext("2d");
  setupCrispCanvas();
  return { canvas, ctx };
}
export function getCanvas() {
  return canvas;
}
export function getCtx() {
  return ctx;
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

// ========= Night overlay =========
export function drawNightOverlay(tSec) {
  if (!CONFIG.IS_NIGHT) return;
  const alpha = 0.55;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#0b1b3a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // stars
  const starCount = 150; // Aumentado de 120 a 150
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

    // Mejorar la animación de parpadeo
    const baseAlpha = 0.4 + tw * 0.6; // Aumentado de 0.25 + tw * 0.55
    const twinkle = Math.sin(tSec * 5 + i * 0.8) * 0.3 + 1; // Parpadeo adicional
    const a = baseAlpha * twinkle;

    ctx.save();
    ctx.globalAlpha = a;

    // Variedad de colores y tamaños para las estrellas
    const starType = rnd();
    let starSize = 1;
    let starColor = "#fff8c4";

    if (starType < 0.05) {
      // Estrellas muy brillantes (5%)
      starColor = "#fff8c4"; // Cambiado de blanco a amarillo claro
      starSize = 3; // Aumentado de 2 a 3
      ctx.globalAlpha = Math.min(1, a * 1.5);
    } else if (starType < 0.15) {
      // Estrellas brillantes (10%)
      starColor = "#fff8c4";
      starSize = 2; // Aumentado de 1 a 2
    } else if (starType < 0.25) {
      // Estrellas azuladas (10%)
      starColor = "#b8d4ff";
      starSize = 2; // Aumentado de 1 a 2
    } else if (starType < 0.35) {
      // Estrellas amarillentas (10%)
      starColor = "#fff4b8";
      starSize = 2; // Aumentado de 1 a 2
    } else {
      // Estrellas normales (60%)
      starColor = "#fff8c4";
      starSize = 2; // Aumentado de 1 a 2
    }

    ctx.fillStyle = starColor;

    // Dibujar estrellas con diferentes patrones
    if (starType < 0.1) {
      // Estrellas en cruz (10%)
      ctx.fillRect(x - starSize, y, starSize, starSize);
      ctx.fillRect(x + starSize, y, starSize, starSize);
      ctx.fillRect(x, y - starSize, starSize, starSize);
      ctx.fillRect(x, y + starSize, starSize, starSize);
      ctx.fillRect(x, y, starSize, starSize);
    } else if (starType < 0.2) {
      // Estrellas pequeñas en cruz (10%)
      ctx.fillRect(x - 2, y, 2, 2);
      ctx.fillRect(x, y - 2, 2, 2);
      ctx.fillRect(x + 2, y, 2, 2);
      ctx.fillRect(x, y + 2, 2, 2);
      ctx.fillRect(x, y, 2, 2);
    } else {
      // Estrellas simples (80%)
      ctx.fillRect(x, y, starSize, starSize);
    }

    ctx.restore();
  }
}

// ========= No-water mask helpers =========
function cellFromPoint(p) {
  const gx = Math.round((p.x - tileSize / 2) / tileSize);
  const gy = Math.round((p.y - tileSize / 2) / tileSize);
  return { gx, gy };
}
function buildNoWaterMask(polyline, waypoints) {
  const mask = new Set();

  // Casa + avatares en primera fila (desplazados por padding)
  mask.add(`${HOUSE_COL},${HOUSE_ROW}`);
  mask.add(`${HOUSE_COL + 1},${HOUSE_ROW}`);
  mask.add(`${HOUSE_COL + 2},${HOUSE_ROW}`);

  // Camino (un halo 3x3 alrededor de cada punto de la polilínea)
  for (const p of polyline) {
    const { gx, gy } = cellFromPoint(p);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        mask.add(`${gx + dx},${gy + dy}`);
      }
    }
  }
  // Waypoints (recuerdos)
  for (const w of waypoints) mask.add(`${w.x},${w.y}`);
  return mask;
}

// ========= Dynamic layout (mínimo alto grande y estable) =========
export function ensureCapacity() {
  const { waypoints } = computeWaypointsAndPolyline(memories, seed, gridW);
  const lastY = waypoints.length ? waypoints[waypoints.length - 1].y : 0;

  // Mínimo alto forzado (para que en móvil siempre “llene”)
  const MIN_FORCED_ROWS = 40;
  const targetRows = Math.max(MIN_FORCED_ROWS, lastY + 6);

  setGridH(targetRows);
  setupCrispCanvas();
}

// ========= Avatars / icons =========
function drawHouseAndAvatars(tSec = 0) {
  const bobJuan = Math.round(Math.sin(tSec * 2.0) * 2);
  const bobPaula = Math.round(Math.sin(tSec * 2.0 + Math.PI / 2) * 2);

  // Coordenadas en píxeles con padding aplicado
  const houseX = HOUSE_COL * tileSize;
  const houseY = HOUSE_ROW * tileSize;

  // Centrar la casa en su celda (sprite más grande que tile)
  const houseOffsetX = houseX + (tileSize - houseSize) / 2;
  const houseOffsetY = houseY + (tileSize - houseSize) / 2;

  // Dibujar casa con tamaño específico (más grande que avatares)
  ctx.drawImage(
    sprites.house,
    houseOffsetX,
    houseOffsetY,
    houseSize,
    houseSize
  );

  if (gridW >= 3) {
    // avatares a la derecha de la casa (tamaño intermedio)
    const avatarOffsetY = houseY + (tileSize - spriteSize) / 2;

    // Margen izquierdo para los avatares (para que no estén pegados al borde)
    const avatarMarginLeft = tileSize * 0.15; // 15% del tamaño de la celda

    // Juan en la primera celda a la derecha
    ctx.drawImage(
      sprites.juan,
      houseX + tileSize + avatarMarginLeft + (tileSize - spriteSize) / 2,
      avatarOffsetY + bobJuan,
      spriteSize,
      spriteSize
    );

    // Paula en la segunda celda a la derecha
    ctx.drawImage(
      sprites.paula,
      houseX + tileSize * 2 + avatarMarginLeft + (tileSize - spriteSize) / 2,
      avatarOffsetY + bobPaula,
      spriteSize,
      spriteSize
    );
  }
}
function drawIconScaled(img, cx, cy, baseSize, scale = 1, memoryType = null) {
  const w = Math.round(baseSize * scale);
  const h = Math.round(baseSize * scale);
  const dx = Math.round(cx - w / 2);
  const dy = Math.round(cy - h / 2);

  // Dibujar sombra del icono primero (para que esté detrás de todo)
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#2b3a1f";
  ctx.beginPath();
  ctx.ellipse(
    Math.round(cx),
    Math.round(cy + h * 0.32),
    w * 0.35,
    h * 0.18,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  // Dibujar halo transparente redondo con el color del POI (después de la sombra, antes del icono)
  if (memoryType) {
    const haloColor = "#d3d3d3"; // Gris claro pastel para todos los halos
    const haloRadius = Math.max(w, h) * 0.65; // Radio del halo (65% del tamaño del icono para que sea un poco más pequeño)

    ctx.save();
    ctx.globalAlpha = 0.45; // Aumentar transparencia para que se vean más los halos
    ctx.fillStyle = haloColor;
    ctx.beginPath();
    ctx.arc(Math.round(cx), Math.round(cy), haloRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Dibujar el icono al final (encima de todo)
  ctx.drawImage(img, dx, dy, w, h);
}

function drawDateTag(cx, cy, baseSize, createdAt) {
  try {
    const date = new Date(createdAt);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return; // Skip drawing if date is invalid
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;

    // Format: DD/MM (e.g., "15/03")
    const dateText = `${day.toString().padStart(2, "0")}/${month
      .toString()
      .padStart(2, "0")}`;

    // Tag dimensions (must be declared before using in position calculations)
    const tagWidth = 64;
    const tagHeight = 24;

    // Position the tag to the right and slightly above the icon (closer to icon)
    let tagX = cx + baseSize * 0.6;
    let tagY = cy - baseSize * 0.5;

    // Adjust position if tag would go off-screen
    if (tagX + tagWidth > canvas.width) {
      tagX = cx - baseSize * 0.6 - tagWidth; // Move to left side
    }
    if (tagY < 0) {
      tagY = cy + baseSize * 0.5; // Move below icon
    }

    // Draw pixel art style tag background
    ctx.save();

    // Shadow for better visibility
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(
      Math.round(tagX + 1),
      Math.round(tagY + 1),
      tagWidth,
      tagHeight
    );

    // Main tag background (pixelated rectangle)
    ctx.fillStyle = "#2b3a1f";
    ctx.fillRect(Math.round(tagX), Math.round(tagY), tagWidth, tagHeight);

    // Tag border (pixelated outline)
    ctx.strokeStyle = "#4a5a3f";
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(tagX), Math.round(tagY), tagWidth, tagHeight);

    // Inner highlight (pixelated)
    ctx.fillStyle = "#5a6a4f";
    ctx.fillRect(Math.round(tagX + 1), Math.round(tagY + 1), tagWidth - 2, 2);

    // Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      dateText,
      Math.round(tagX + tagWidth / 2),
      Math.round(tagY + tagHeight / 2)
    );

    ctx.restore();
  } catch (error) {
    // Silently skip drawing date tag if there's an error
    console.warn("Error drawing date tag:", error);
  }
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
    drawIconScaled(icon, cx, cy, baseSize, 1, m.type);
    drawPOIAtCell(ctx, w.x, w.y, m.type, tSec);

    // Draw date tag next to the memory icon
    if (m.createdAt) {
      drawDateTag(cx, cy, baseSize, m.createdAt);
    }
  }
}

// ========= Path =========
function drawPathWithShadow(polyline, uptoIndex = polyline.length - 1) {
  if (polyline.length < 2) return;
  uptoIndex = Math.max(1, Math.min(uptoIndex, polyline.length - 1));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // shadow
  ctx.beginPath();
  ctx.moveTo(polyline[0].x, polyline[0].y);
  for (let i = 1; i <= uptoIndex; i++) ctx.lineTo(polyline[i].x, polyline[i].y);
  ctx.strokeStyle = "rgba(50,40,20,0.35)";
  ctx.lineWidth = 26;
  ctx.stroke();

  // body
  ctx.beginPath();
  ctx.moveTo(polyline[0].x, polyline[0].y);
  for (let i = 1; i <= uptoIndex; i++) ctx.lineTo(polyline[i].x, polyline[i].y);
  ctx.strokeStyle = "#c2b280";
  ctx.lineWidth = 22;
  ctx.stroke();

  // highlight
  ctx.beginPath();
  ctx.moveTo(polyline[0].x, polyline[0].y);
  for (let i = 1; i <= uptoIndex; i++) ctx.lineTo(polyline[i].x, polyline[i].y);
  ctx.strokeStyle = "#e8d8a5";
  ctx.lineWidth = 10;
  ctx.stroke();
}

// New function for smooth path drawing during animation
// This ensures the path drawing speed matches the avatar movement speed
function drawPathWithShadowSmooth(polyline, progressIdx) {
  if (polyline.length < 2) return;

  const currentIdx = Math.floor(progressIdx);
  const nextIdx = Math.min(currentIdx + 1, polyline.length - 1);
  const interpolation = progressIdx - currentIdx;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // shadow
  ctx.beginPath();
  ctx.moveTo(polyline[0].x, polyline[0].y);
  for (let i = 1; i <= currentIdx; i++)
    ctx.lineTo(polyline[i].x, polyline[i].y);

  // Interpolate the last segment for smooth movement
  if (currentIdx < polyline.length - 1) {
    const a = polyline[currentIdx];
    const b = polyline[nextIdx];
    const smoothX = a.x + (b.x - a.x) * interpolation;
    const smoothY = a.y + (b.y - a.y) * interpolation;
    ctx.lineTo(smoothX, smoothY);
  }

  ctx.strokeStyle = "rgba(50,40,20,0.35)";
  ctx.lineWidth = 26;
  ctx.stroke();

  // body
  ctx.beginPath();
  ctx.moveTo(polyline[0].x, polyline[0].y);
  for (let i = 1; i <= currentIdx; i++)
    ctx.lineTo(polyline[i].x, polyline[i].y);

  // Interpolate the last segment for smooth movement
  if (currentIdx < polyline.length - 1) {
    const a = polyline[currentIdx];
    const b = polyline[nextIdx];
    const smoothX = a.x + (b.x - a.x) * interpolation;
    const smoothY = a.y + (b.y - a.y) * interpolation;
    ctx.lineTo(smoothX, smoothY);
  }

  ctx.strokeStyle = "#c2b280";
  ctx.lineWidth = 22;
  ctx.stroke();

  // highlight
  ctx.beginPath();
  ctx.moveTo(polyline[0].x, polyline[0].y);
  for (let i = 1; i <= currentIdx; i++)
    ctx.lineTo(polyline[i].x, polyline[i].y);

  // Interpolate the last segment for smooth movement
  if (currentIdx < polyline.length - 1) {
    const a = polyline[currentIdx];
    const b = polyline[nextIdx];
    const smoothX = a.x + (b.x - a.x) * interpolation;
    const smoothY = a.y + (b.y - a.y) * interpolation;
    ctx.lineTo(smoothX, smoothY);
  }

  ctx.strokeStyle = "#e8d8a5";
  ctx.lineWidth = 10;
  ctx.stroke();
}

// ========= Main draws =========
export function drawStatic(tSec = 0) {
  const { waypoints, polyline } = computeWaypointsAndPolyline(
    memories,
    seed,
    gridW
  );
  const mask = buildNoWaterMask(polyline, waypoints);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTiles(ctx, gridW, gridH, seed, mask);
  drawPathWithShadow(polyline);
  drawNightOverlay(tSec);
  return { waypoints, polyline };
}

export function drawIdleFrame(tSec, dt = 0) {
  const { waypoints } = computeWaypointsAndPolyline(memories, seed, gridW);
  drawHouseAndAvatars(tSec);
  drawIcons(waypoints, waypoints.length - 1, tSec);
  updateAndDrawSparkles(ctx, dt);
  drawClouds(ctx, tSec);
}

export function drawMap(tSec = 0) {
  drawStatic(tSec);
  drawHouseAndAvatars(tSec);
  const { waypoints } = computeWaypointsAndPolyline(memories, seed, gridW);
  drawIcons(waypoints, waypoints.length - 1, tSec);
  drawClouds(ctx, tSec);
}

// ========= Auto-focus last memory if below view =========
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

// ========= Add-memory animation =========
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
    const mask = buildNoWaterMask(polyline, waypoints);
    drawTiles(ctx, gridW, gridH, seed, mask);
    drawPathWithShadowSmooth(polyline, progressIdx);
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
      }
      drawIconScaled(icon, cx, cy, baseSize, scale, m.type);
      drawPOIAtCell(ctx, w.x, w.y, m.type, tSec);

      // Draw date tag next to the memory icon
      if (m.createdAt) {
        drawDateTag(cx, cy, baseSize, m.createdAt);
      }
    }

    // Get current and next polyline points for smooth interpolation
    const currentIdx = Math.floor(progressIdx);
    const nextIdx = Math.min(currentIdx + 1, polyline.length - 1);
    const interpolation = progressIdx - currentIdx;

    const a = polyline[currentIdx];
    const b = polyline[nextIdx];

    // Interpolate position smoothly between current and next point
    const smoothX = a.x + (b.x - a.x) * interpolation;
    const smoothY = a.y + (b.y - a.y) * interpolation;

    // Draw both avatars walking together with slight offset
    if (
      sprites.juan &&
      sprites.juan.width &&
      sprites.paula &&
      sprites.paula.width
    ) {
      // Draw Juan (boy) slightly behind and to the left with synchronized bobbing animation
      const juanBobOffset = Math.sin(tSec * 4) * 1.2;
      ctx.drawImage(
        sprites.juan,
        smoothX - 20,
        smoothY - 16 + juanBobOffset,
        32,
        32
      );

      // Draw Paula (girl) slightly ahead and to the right with synchronized bobbing animation
      const paulaBobOffset = Math.sin(tSec * 4 + Math.PI * 0.4) * 1.2;
      ctx.drawImage(
        sprites.paula,
        smoothX - 12,
        smoothY - 16 + paulaBobOffset,
        32,
        32
      );
    } else {
      // Fallback if sprites aren't loaded
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(smoothX, smoothY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spawn sparkles when avatars reach the new memory location and the icon is fully visible
    if (!sparkSpawned) {
      const prog = (progressIdx - prevEnd) / Math.max(1, totalEnd - prevEnd);
      // Wait until the icon is almost completely visible (popPhase > 0.98) before spawning sparkles
      const popPhase = clamp((prog - 0.7) / 0.3, 0, 1);
      if (popPhase > 0.98) {
        sparkSpawned = true;
        // Get the position of the new memory (last waypoint)
        const newMemoryPos = waypoints[waypoints.length - 1];
        const sparkX = newMemoryPos.x * tileSize + 8 + baseSize / 2;
        const sparkY = newMemoryPos.y * tileSize + 8 + baseSize / 2;
        spawnSparkles(sparkX, sparkY, seed, 25);
      }
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

    // Use smoother interpolation for more fluid movement
    const exactIdx = prevEnd + eased * (totalEnd - prevEnd);
    const idx = Math.max(prevEnd, Math.min(totalEnd, exactIdx));

    render(idx, ts / 1000, dt);

    // Always request next frame for smoother animation
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      drawMap(ts / 1000);
    }
  }
  requestAnimationFrame(step);
}

// ========= Idle loop =========
let idleRAF = null;
let lastIdleTs = null;

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

export function startIdleLoop() {
  if (!CONFIG.ANIM_IDLE) return;
  if (idleRAF) cancelAnimationFrame(idleRAF);
  idleRAF = requestAnimationFrame(idleFrame);
}
