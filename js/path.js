// js/path.js
import { clamp, seeded, randIntSeeded, randSignSeeded } from "./utils.js";
import { cellCenter } from "./state.js";

// === Padding perimetral de 1 casilla ===
export const HOUSE_COL = 1; // antes 0
export const HOUSE_ROW = 1; // antes 0

/**
 * Genera los waypoints (celdas de recuerdos) y la polilínea del camino.
 * - Comienza en la casa (HOUSE_COL, HOUSE_ROW)
 * - Primer paso: se desplaza 1 casilla a la derecha (aire entre casa y camino)
 * - Siempre respeta 1 casilla de margen en izquierda y derecha
 */
export function computeWaypointsAndPolyline(memories, seed, gridW) {
  const minX = 1; // margen izquierdo
  const maxX = gridW - 2; // margen derecho

  const waypoints = [];
  const polyline = [];

  // punto de partida: casa
  let curX = HOUSE_COL;
  let curY = HOUSE_ROW;

  // empuje inicial a la derecha (un paso de aire sobre la casa)
  const startX = clamp(HOUSE_COL + 1, minX, maxX);
  polyline.push(cellCenter(HOUSE_COL, HOUSE_ROW));
  polyline.push(cellCenter(startX, curY));
  curX = startX;

  // para cada memoria, descendemos 2-3 filas con serpenteos controlados
  for (let i = 0; i < memories.length; i++) {
    const rows = randIntSeeded(2, 3, seed, 1000 + i);

    // objetivo lateral “distante”, con signo aleatorio, pero acotado por min/max
    const lateral =
      randIntSeeded(1, 8, seed, 2000 + i) * randSignSeeded(seed, 3000 + i);
    let targetX = clamp(curX + lateral, minX, maxX);

    // pequeños “wiggles” por fila (izq/dcha/pause) para dar vida al camino
    const wiggles = Array.from({ length: rows }, (_, s) => {
      const r = seeded(seed, (i + 1) * 4000 + s);
      return r < 0.18 ? -1 : r > 0.82 ? 1 : 0;
    });

    let nextX = curX;
    for (let step = 1; step <= rows; step++) {
      const y = curY + step;
      const toward = Math.sign(targetX - nextX);
      if (toward !== 0) nextX = clamp(nextX + toward, minX, maxX);
      nextX = clamp(nextX + wiggles[step - 1], minX, maxX);
      polyline.push(cellCenter(nextX, y));
    }

    curX = nextX;
    curY += rows;

    waypoints.push({ x: curX, y: curY, idx: i });
  }

  return { waypoints, polyline };
}
