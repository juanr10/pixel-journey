export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const easeInOut = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function seeded(seed, salt) {
  const s = (seed ^ (salt * 0x9e3779b9)) >>> 0;
  return mulberry32(s)();
}
export function randIntSeeded(min, max, seed, salt) {
  const r = seeded(seed, salt);
  return Math.floor(r * (max - min + 1)) + min;
}
export function randSignSeeded(seed, salt) {
  return seeded(seed, salt) < 0.5 ? -1 : 1;
}

// Semilla FNV-1a 32-bit a partir de texto
export function strToSeed(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
