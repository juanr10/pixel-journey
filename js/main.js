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
import { LoadingScreen, simulateLoadingProcess } from "./loading-screen.js";
import { NavigationManager } from "./navigation.js";
import { updateHtmlImageReferences } from "./html-assets.js";

function fitBoardDimensions() {
  // 1) Escala del tile según viewport
  recomputeTileSize();

  // 2) Ajuste de columnas para no desbordar ancho visible
  const sidePadding = 32; // coincide aprox con .boardWrap
  const maxColsByWidth = Math.max(
    6, // Permitir mínimo de 6 para mobile
    Math.floor((window.innerWidth - sidePadding * 2) / tileSize)
  );

  // base por breakpoint + límite de ancho real
  let cols;
  if (window.innerWidth > 1400) cols = 18;
  else if (window.innerWidth > 1024) cols = 16;
  else cols = 6; // Reducir a 6 para mobile (muy estrecho)

  cols = Math.min(cols, maxColsByWidth);
  setGridW(cols);
}

// Inicializar sistema de memories
async function initMemorySystem() {
  try {
    console.log("Inicializando sistema de memories...");

    // El sistema de memories se inicializa automáticamente en ui.js
    // No necesitamos inicializar ejemplos aquí

    console.log("✅ Sistema de memories listo para usar");
    return null;
  } catch (error) {
    console.error("❌ Error inicializando sistema de memories:", error);
    return null;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  // Inicializar navegación
  const navigation = new NavigationManager();

  try {
    // Iniciar proceso de carga simulado (sin pantalla de carga)
    const loadingPromise = simulateLoadingProcess();

    // Inicializar aplicación en paralelo
    fitBoardDimensions();
    const { canvas } = initCanvas();

    await Promise.all([loadSprites(), loadTileset()]);

    ensureCapacity();
    drawMap();

    // El sistema de memories se inicializa automáticamente en ui.js
    await initMemorySystem();

    // Inicializar UI (que ahora usará el sistema de memories)
    initUI();

    // Actualizar referencias de imágenes en el HTML
    updateHtmlImageReferences();

    // Las nubes se inicializan condicionalmente (desactivadas en móviles para mejor rendimiento)
    initClouds(canvas);
    bindScrollParallax();
    startIdleLoop();

    // Esperar a que termine el proceso de carga simulado
    await loadingPromise;

    // Ir directo al menú principal (sin pantalla de carga)
    navigation.transitionFromLoading();

    window.addEventListener("resize", () => {
      fitBoardDimensions();
      ensureCapacity();
      drawMap();
      // Actualizar configuración de nubes dinámicamente
      updateCloudsConfig();
    });

    // Asegura que al cargar no "desaparezca" la casa por scroll previo
    window.scrollTo({ top: 0, behavior: "instant" });
  } catch (error) {
    console.error("Error during app initialization:", error);
    loadingScreen.updateProgress("Error loading application");
    // Ocultar pantalla de carga incluso si hay error
    loadingScreen.hide();
    navigation.transitionFromLoading();
  }
});
