import { strToSeed } from "./utils.js";

export const Sparkles = { active: false, particles: [] };

export function spawnSparkles(x, y, seed, count = 18) {
  Sparkles.particles = [];
  const rnd = (function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })(strToSeed("SPARKLE") ^ (seed >>> 0));

  for (let i = 0; i < count; i++) {
    const ang = rnd() * Math.PI * 2;
    const spd = 50 + rnd() * 120;
    const life = 450 + rnd() * 300;
    const size = 2 + (rnd() < 0.3 ? 1 : 0);
    const huePick = rnd();
    const color =
      huePick < 0.5 ? "#fff7b0" : huePick < 0.8 ? "#ffe28a" : "#ffd1f3";
    Sparkles.particles.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life,
      age: 0,
      size,
      color,
    });
  }
  Sparkles.active = true;
}

export function updateAndDrawSparkles(ctx, dt) {
  if (!Sparkles.active) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = Sparkles.particles.length - 1; i >= 0; i--) {
    const p = Sparkles.particles[i];
    p.age += dt * 1000;
    if (p.age >= p.life) {
      Sparkles.particles.splice(i, 1);
      continue;
    }
    const t = p.age / p.life;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 10 * dt;
    const alpha = 1 - t;
    const s = p.size;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
  }
  ctx.restore();
  if (Sparkles.particles.length === 0) Sparkles.active = false;
}
