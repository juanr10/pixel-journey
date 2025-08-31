// js/main.js
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
import { recomputeTileSize, tileSize, updateCloudsConfig } from "./config.js";
import { setGridW } from "./state.js";

function fitBoardDimensions() {
  // 1) Escala del tile según viewport
  recomputeTileSize();

  // 2) Ajuste de columnas para no desbordar ancho visible
  const sidePadding = 32; // coincide aprox con .boardWrap
  const maxColsByWidth = Math.max(
    10,
    Math.floor((window.innerWidth - sidePadding * 2) / tileSize)
  );

  // base por breakpoint + límite de ancho real
  let cols;
  if (window.innerWidth > 1400) cols = 18;
  else if (window.innerWidth > 1024) cols = 16;
  else if (window.innerWidth > 600) cols = 12;
  else cols = 10;

  cols = Math.min(cols, maxColsByWidth);
  setGridW(cols);
}

window.addEventListener("DOMContentLoaded", async () => {
  fitBoardDimensions();

  const { canvas } = initCanvas();
  await Promise.all([loadSprites(), loadTileset()]);
  ensureCapacity();
  drawMap();
  initUI();
  // Las nubes se inicializan condicionalmente (desactivadas en móviles para mejor rendimiento)
  initClouds(canvas);
  bindScrollParallax();
  startIdleLoop();

  window.addEventListener("resize", () => {
    fitBoardDimensions();
    ensureCapacity();
    drawMap();
    // Actualizar configuración de nubes dinámicamente
    updateCloudsConfig();
  });

  // Asegura que al cargar no "desaparezca" la casa por scroll previo
  window.scrollTo({ top: 0, behavior: "instant" });
});
