import { tileSize, CONFIG } from "./config.js";
import { clamp, randIntSeeded, randSignSeeded, seeded } from "./utils.js";
import { houseCol, houseRow, minX } from "./state.js";

export function computeWaypointsAndPolyline(memories, seed, gridW) {
  const waypoints = [],
    polyline = [];
  let curX = houseCol,
    curY = houseRow;
  if (gridW > 1) curX = 1;

  polyline.push(cellCenter(houseCol, houseRow));
  polyline.push(cellCenter(curX, curY));

  const minx = minX,
    maxx = gridW - 2;

  for (let i = 0; i < memories.length; i++) {
    const rows = randIntSeeded(2, 3, seed, 1000 + i);
    const lateral =
      randIntSeeded(1, 8, seed, 2000 + i) * randSignSeeded(seed, 3000 + i);
    let targetX = clamp(curX + lateral, minx, maxx);

    // 👇 Determinista: SIN Math.random()
    const wiggles = Array.from({ length: rows }, (_, s) => {
      const r = seeded(seed, (i + 1) * 4000 + s * 97);
      return r < 0.18 ? -1 : r > 0.82 ? 1 : 0;
    });

    let nextX = curX;
    for (let step = 1; step <= rows; step++) {
      const y = curY + step;
      const toward = Math.sign(targetX - nextX);
      if (toward !== 0) nextX = clamp(nextX + toward, minx, maxx);
      nextX = clamp(nextX + wiggles[step - 1], minx, maxx);
      polyline.push(cellCenter(nextX, y));
    }
    curX = nextX;
    curY += rows;
    waypoints.push({ x: curX, y: curY, idx: i });
  }
  return { waypoints, polyline };
}

export function drawPath(ctx, polyline, uptoIndex = polyline.length - 1) {
  if (polyline.length < 2) return;
  uptoIndex = Math.max(1, Math.min(uptoIndex, polyline.length - 1));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(Math.round(polyline[0].x), Math.round(polyline[0].y));
  for (let i = 1; i <= uptoIndex; i++)
    ctx.lineTo(Math.round(polyline[i].x), Math.round(polyline[i].y));
  ctx.strokeStyle = "#c2b280";
  ctx.lineWidth = 22;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(Math.round(polyline[0].x), Math.round(polyline[0].y));
  for (let i = 1; i <= uptoIndex; i++)
    ctx.lineTo(Math.round(polyline[i].x), Math.round(polyline[i].y));
  ctx.strokeStyle = "#e8d7a5";
  ctx.lineWidth = 10;
  ctx.stroke();
}

export function cellCenter(x, y) {
  return { x: x * tileSize + tileSize / 2, y: y * tileSize + tileSize / 2 };
}
