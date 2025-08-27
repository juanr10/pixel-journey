import {
  initCanvas,
  drawMap,
  startIdleLoop,
  ensureCapacity,
} from "./render.js";
import { loadSprites } from "./sprites.js";
import { loadTileset } from "./tiles.js";
import { initUI } from "./ui.js";
import { initClouds, bindScrollParallax } from "./clouds.js";

window.addEventListener("DOMContentLoaded", async () => {
  const { canvas } = initCanvas();
  await Promise.all([loadSprites(), loadTileset()]);
  ensureCapacity();
  drawMap();
  initUI();
  initClouds(canvas);
  bindScrollParallax();
  startIdleLoop();

  window.addEventListener("resize", () => {
    ensureCapacity();
    drawMap();
  });
});
