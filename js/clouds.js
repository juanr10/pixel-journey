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
  const hiResScale = 4; // Aumentado para mejor calidad
  const offHR = document.createElement("canvas");
  offHR.width = width * hiResScale;
  offHR.height = height * hiResScale;
  const cx = offHR.getContext("2d", { willReadFrequently: true });
  cx.imageSmoothingEnabled = true;

  const rnd = mulberry32(seedVal >>> 0);

  // Colores base para las nubes (más apropiados para modo nocturno)
  const cloudWhite = "#ffffff";
  const cloudLight = "#f8f8f8";
  const cloudShadow = "#e8e8e8";
  const cloudDark = "#d8d8d8";

  // Colores nocturnos para las nubes
  const nightCloudWhite = "#e8e8e8";
  const nightCloudLight = "#d0d0d0";
  const nightCloudShadow = "#b8b8b8";
  const nightCloudDark = "#a0a0a0";

  // Limpiar canvas
  cx.clearRect(0, 0, offHR.width, offHR.height);

  // Crear nube base con forma más orgánica
  const centerX = offHR.width * 0.5;
  const centerY = offHR.height * 0.6;

  // Número de lóbulos principales (más variado)
  const mainLobes = 3 + Math.floor(rnd() * 3);
  const secondaryLobes = 2 + Math.floor(rnd() * 2);

  // Lóbulos principales (más grandes y centrados)
  for (let i = 0; i < mainLobes; i++) {
    const angle = (i / mainLobes) * Math.PI * 1.8 - Math.PI * 0.9;
    const distance = offHR.height * (0.25 + rnd() * 0.15);
    const radius = offHR.height * (0.18 + rnd() * 0.12);

    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance * 0.3;

    // Crear lóbulo principal con gradiente
    const gradient = cx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, cloudWhite);
    gradient.addColorStop(0.7, cloudLight);
    gradient.addColorStop(1, cloudShadow);

    cx.fillStyle = gradient;
    cx.beginPath();
    cx.arc(x, y, radius, 0, Math.PI * 2);
    cx.fill();
  }

  // Lóbulos secundarios (más pequeños, alrededor)
  for (let i = 0; i < secondaryLobes; i++) {
    const angle = (i / secondaryLobes) * Math.PI * 2 + rnd() * Math.PI * 0.5;
    const distance = offHR.height * (0.35 + rnd() * 0.2);
    const radius = offHR.height * (0.12 + rnd() * 0.08);

    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance * 0.4;

    cx.fillStyle = cloudLight;
    cx.beginPath();
    cx.arc(x, y, radius, 0, Math.PI * 2);
    cx.fill();
  }

  // Lóbulos de relleno (para conectar y suavizar)
  for (let i = 0; i < 4; i++) {
    const x = centerX + (rnd() - 0.5) * offHR.width * 0.6;
    const y = centerY + (rnd() - 0.5) * offHR.height * 0.4;
    const radius = offHR.height * (0.08 + rnd() * 0.06);

    // Solo dibujar si está cerca de otros lóbulos
    if (
      Math.abs(x - centerX) < offHR.width * 0.4 &&
      Math.abs(y - centerY) < offHR.height * 0.3
    ) {
      cx.fillStyle = cloudLight;
      cx.beginPath();
      cx.arc(x, y, radius, 0, Math.PI * 2);
      cx.fill();
    }
  }

  // Sombreado inferior sutil para dar profundidad
  const shadowGradient = cx.createLinearGradient(0, centerY, 0, offHR.height);
  shadowGradient.addColorStop(0, "rgba(0,0,0,0)");
  shadowGradient.addColorStop(0.5, "rgba(0,0,0,0.05)");
  shadowGradient.addColorStop(1, "rgba(0,0,0,0.1)");

  cx.globalCompositeOperation = "multiply";
  cx.fillStyle = shadowGradient;
  cx.fillRect(0, centerY, offHR.width, offHR.height - centerY);
  cx.globalCompositeOperation = "source-over";

  // Detalles finos con píxeles individuales para estilo pixel art
  const detailPixels = 8 + Math.floor(rnd() * 6);
  for (let i = 0; i < detailPixels; i++) {
    const x = Math.floor(rnd() * offHR.width);
    const y = Math.floor(rnd() * offHR.height * 0.7);
    const size = 1 + Math.floor(rnd() * 2);

    // Solo añadir detalles en áreas claras
    const imageData = cx.getImageData(x, y, 1, 1);
    const brightness =
      (imageData.data[0] + imageData.data[1] + imageData.data[2]) / 3;

    if (brightness > 200) {
      cx.fillStyle = rnd() > 0.5 ? cloudWhite : cloudLight;
      cx.fillRect(x, y, size, size);
    }
  }

  // Reducir a resolución final
  const off = document.createElement("canvas");
  off.width = width;
  off.height = height;
  const c2 = off.getContext("2d");
  c2.imageSmoothingEnabled = false; // Mantener pixel art nítido
  c2.drawImage(offHR, 0, 0, off.width, off.height);

  return off;
}

// Función para crear nubes con colores nocturnos
function makeNightCloudSprite(width, height, seedVal) {
  const hiResScale = 4;
  const offHR = document.createElement("canvas");
  offHR.width = width * hiResScale;
  offHR.height = height * hiResScale;
  const cx = offHR.getContext("2d", { willReadFrequently: true });
  cx.imageSmoothingEnabled = true;

  const rnd = mulberry32(seedVal >>> 0);

  // Colores nocturnos para las nubes (más oscuros y sutiles)
  const cloudWhite = "#e8e8e8";
  const cloudLight = "#d0d0d0";
  const cloudShadow = "#b8b8b8";
  const cloudDark = "#a0a0a0";

  // Limpiar canvas
  cx.clearRect(0, 0, offHR.width, offHR.height);

  // Crear nube base con forma más orgánica
  const centerX = offHR.width * 0.5;
  const centerY = offHR.height * 0.6;

  // Número de lóbulos principales
  const mainLobes = 3 + Math.floor(rnd() * 3);
  const secondaryLobes = 2 + Math.floor(rnd() * 2);

  // Lóbulos principales
  for (let i = 0; i < mainLobes; i++) {
    const angle = (i / mainLobes) * Math.PI * 1.8 - Math.PI * 0.9;
    const distance = offHR.height * (0.25 + rnd() * 0.15);
    const radius = offHR.height * (0.18 + rnd() * 0.12);

    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance * 0.3;

    // Crear lóbulo principal con gradiente
    const gradient = cx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, cloudWhite);
    gradient.addColorStop(0.7, cloudLight);
    gradient.addColorStop(1, cloudShadow);

    cx.fillStyle = gradient;
    cx.beginPath();
    cx.arc(x, y, radius, 0, Math.PI * 2);
    cx.fill();
  }

  // Lóbulos secundarios
  for (let i = 0; i < secondaryLobes; i++) {
    const angle = (i / secondaryLobes) * Math.PI * 2 + rnd() * Math.PI * 0.5;
    const distance = offHR.height * (0.35 + rnd() * 0.2);
    const radius = offHR.height * (0.12 + rnd() * 0.08);

    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance * 0.4;

    cx.fillStyle = cloudLight;
    cx.beginPath();
    cx.arc(x, y, radius, 0, Math.PI * 2);
    cx.fill();
  }

  // Lóbulos de relleno
  for (let i = 0; i < 4; i++) {
    const x = centerX + (rnd() - 0.5) * offHR.width * 0.6;
    const y = centerY + (rnd() - 0.5) * offHR.height * 0.4;
    const radius = offHR.height * (0.08 + rnd() * 0.06);

    if (
      Math.abs(x - centerX) < offHR.width * 0.4 &&
      Math.abs(y - centerY) < offHR.height * 0.3
    ) {
      cx.fillStyle = cloudLight;
      cx.beginPath();
      cx.arc(x, y, radius, 0, Math.PI * 2);
      cx.fill();
    }
  }

  // Sombreado inferior más sutil para modo nocturno
  const shadowGradient = cx.createLinearGradient(0, centerY, 0, offHR.height);
  shadowGradient.addColorStop(0, "rgba(0,0,0,0)");
  shadowGradient.addColorStop(0.5, "rgba(0,0,0,0.08)");
  shadowGradient.addColorStop(1, "rgba(0,0,0,0.15)");

  cx.globalCompositeOperation = "multiply";
  cx.fillStyle = shadowGradient;
  cx.fillRect(0, centerY, offHR.width, offHR.height - centerY);
  cx.globalCompositeOperation = "source-over";

  // Detalles finos
  const detailPixels = 8 + Math.floor(rnd() * 6);
  for (let i = 0; i < detailPixels; i++) {
    const x = Math.floor(rnd() * offHR.width);
    const y = Math.floor(rnd() * offHR.height * 0.7);
    const size = 1 + Math.floor(rnd() * 2);

    const imageData = cx.getImageData(x, y, 1, 1);
    const brightness =
      (imageData.data[0] + imageData.data[1] + imageData.data[2]) / 3;

    if (brightness > 180) {
      cx.fillStyle = rnd() > 0.5 ? cloudWhite : cloudLight;
      cx.fillRect(x, y, size, size);
    }
  }

  // Reducir a resolución final
  const off = document.createElement("canvas");
  off.width = width;
  off.height = height;
  const c2 = off.getContext("2d");
  c2.imageSmoothingEnabled = false;
  c2.drawImage(offHR, 0, 0, off.width, off.height);

  return off;
}

export function initClouds(canvas) {
  if (!CONFIG.CLOUDS) return;

  // Generar nubes diurnas y nocturnas
  Clouds.spriteSmall = makeCloudSprite(32, 20, strToSeed("CLOUDS_SMALL"));
  Clouds.spriteBig = makeCloudSprite(48, 24, strToSeed("CLOUDS_BIG"));

  // Nubes nocturnas (más oscuras y sutiles)
  Clouds.nightSpriteSmall = makeNightCloudSprite(
    32,
    20,
    strToSeed("CLOUDS_NIGHT_SMALL")
  );
  Clouds.nightSpriteBig = makeNightCloudSprite(
    48,
    24,
    strToSeed("CLOUDS_NIGHT_BIG")
  );

  const w = canvas.width,
    h = canvas.height;

  // Capa lejana (más lenta, más alta)
  const far = [];
  for (let i = 0; i < 8; i++) {
    // Más nubes para mejor cobertura
    far.push({
      x: Math.floor(Math.random() * w * 1.2) - w * 0.1, // Empezar fuera de pantalla
      y: 15 + i * Math.floor(h / 12) + Math.floor(Math.random() * 15),
      speed: 6 + Math.random() * 4, // Velocidad más variada
      scale: 2.5 + Math.random() * 1.5, // Escala más variada
      sprite: i % 3 === 0 ? Clouds.spriteBig : Clouds.spriteSmall,
      vyFactor: 0.03 + Math.random() * 0.02, // Parallax más sutil
      alpha: 0.7 + Math.random() * 0.3, // Transparencia variable
    });
  }

  // Capa media (velocidad intermedia)
  const mid = [];
  for (let i = 0; i < 6; i++) {
    mid.push({
      x: Math.floor(Math.random() * w * 1.3) - w * 0.15,
      y: 25 + i * Math.floor(h / 10) + Math.floor(Math.random() * 20),
      speed: 12 + Math.random() * 6,
      scale: 2.8 + Math.random() * 1.2,
      sprite: i % 2 === 0 ? Clouds.spriteBig : Clouds.spriteSmall,
      vyFactor: 0.05 + Math.random() * 0.03,
      alpha: 0.8 + Math.random() * 0.2,
    });
  }

  // Capa cercana (más rápida, más baja)
  const near = [];
  for (let i = 0; i < 4; i++) {
    near.push({
      x: Math.floor(Math.random() * w * 1.4) - w * 0.2,
      y: 35 + i * Math.floor(h / 8) + Math.floor(Math.random() * 25),
      speed: 18 + Math.random() * 8,
      scale: 3.2 + Math.random() * 1.8,
      sprite: i % 2 === 0 ? Clouds.spriteBig : Clouds.spriteSmall,
      vyFactor: 0.08 + Math.random() * 0.04,
      alpha: 0.9 + Math.random() * 0.1,
    });
  }

  Clouds.layers = [far, mid, near]; // Tres capas para mejor profundidad
  Clouds.ready = true;
}

export function updateClouds(dt, canvas) {
  if (!CONFIG.CLOUDS || !Clouds.ready) return;
  const w = canvas.width;

  Clouds.layers.forEach((layer, layerIndex) => {
    layer.forEach((c) => {
      // Movimiento más suave con delta time
      c.x += c.speed * dt;

      // Reciclar nubes cuando salen de pantalla
      const sw = c.sprite.width * c.scale;
      if (c.x - sw > w + 50) {
        // Buffer extra para transición suave
        // Reposicionar al inicio con variación en Y
        c.x = -sw - Math.random() * 100;
        c.y = c.y + (Math.random() - 0.5) * 15; // Variación vertical más controlada
        c.y = Math.max(10, Math.min(canvas.height * 0.6, c.y)); // Mantener en rango
      }

      // Movimiento vertical sutil para simular flotación (más controlado)
      const floatOffset = Math.sin(Date.now() * 0.0005 + c.x * 0.005) * 0.5;
      c.y += floatOffset * dt * 0.5;
    });
  });
}

export function drawClouds(ctx, tSec) {
  if (!CONFIG.CLOUDS || !Clouds.ready) return;
  const nightness = CONFIG.IS_NIGHT ? 1 : 0;

  // Modificado: las nubes ahora son visibles de noche pero más oscuras
  const dayAlpha = clamp(1 - nightness * 0.4, 0.6, 1); // Mínimo 0.6 en lugar de 0

  const prevSmooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false; // Mantener pixel art nítido

  ctx.save();

  // Efecto de viento sutil basado en el tiempo
  const windOffset = Math.sin(tSec * 0.1) * 2;

  Clouds.layers.forEach((layer, layerIndex) => {
    layer.forEach((c) => {
      const dw = c.sprite.width * c.scale;
      const dh = c.sprite.height * c.scale;
      const parallaxY = Clouds.scrollY * c.vyFactor;

      // Posición con efecto de viento
      const dx = Math.round(c.x + windOffset * (layerIndex + 1) * 0.3);
      const dy = Math.round(c.y + parallaxY);

      // Aplicar transparencia individual de cada nube
      const finalAlpha = dayAlpha * c.alpha * 0.7;
      ctx.globalAlpha = finalAlpha;

      // Dibujar sombra sutil
      ctx.save();
      ctx.globalAlpha = finalAlpha * 0.3;
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(dx + 2, dy + 2, dw, dh);
      ctx.restore();

      // Dibujar nube principal (usar sprite nocturno si es de noche)
      ctx.globalAlpha = finalAlpha;
      if (CONFIG.IS_NIGHT) {
        // Usar sprites nocturnos apropiados
        const nightSprite =
          c.sprite === Clouds.spriteSmall
            ? Clouds.nightSpriteSmall
            : Clouds.nightSpriteBig;
        ctx.drawImage(nightSprite, dx, dy, dw, dh);
      } else {
        ctx.drawImage(c.sprite, dx, dy, dw, dh);
      }
    });
  });

  ctx.restore();
  ctx.imageSmoothingEnabled = prevSmooth;
}

export function bindScrollParallax() {
  let lastScrollSent = 0;
  let targetScrollY = 0;
  let currentScrollY = 0;

  // Función para suavizar el scroll
  function smoothScroll() {
    currentScrollY += (targetScrollY - currentScrollY) * 0.1;
    Clouds.scrollY = currentScrollY;

    if (Math.abs(targetScrollY - currentScrollY) > 0.1) {
      requestAnimationFrame(smoothScroll);
    }
  }

  window.addEventListener("scroll", () => {
    const now = performance.now();
    if (now - lastScrollSent > 16) {
      targetScrollY = window.scrollY;
      lastScrollSent = now;

      // Iniciar animación suave si no está corriendo
      if (Math.abs(targetScrollY - currentScrollY) > 1) {
        smoothScroll();
      }
    }
  });
}
