import { CONFIG, tileSize } from "./config.js";

export function drawPOIAtCell(ctx, cellX, cellY, type, tSec = 0) {
  if (!CONFIG.SHOW_POIS) return;
  const cxp = cellX * tileSize + tileSize * 0.78;
  const cyp = cellY * tileSize + tileSize * 0.22;

  const pulse = (Math.sin(tSec * 3 + (cellX * 7 + cellY * 11) * 0.2) + 1) / 2;
  const haloR = 7 + Math.round(3 * pulse);
  const haloA = 0.18 + 0.22 * pulse;

  ctx.save();
  ctx.globalAlpha = haloA;
  ctx.fillStyle = "#fff8c4";
  ctx.beginPath();
  ctx.arc(Math.round(cxp), Math.round(cyp), haloR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(cxp, cyp);
  ctx.rotate(Math.PI / 4);
  const c =
    {
      travel: "#ffd27a",
      mountain: "#d2ff7a",
      game: "#7ad2ff",
      love: "#ff99c8",
      camera: "#f0e3b5",
      museo: "#8b5a2b",
    }[type] || "#f0e3b5";
  ctx.fillStyle = c;
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
}
