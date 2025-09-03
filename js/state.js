// js/state.js
import { tileSize } from "./config.js";

export let gridW = 16;
export let gridH = 12;
export const houseCol = 0,
  houseRow = 0;
export const minX = 1;
export const maxX = () => gridW - 2;

export let seed = Number(localStorage.getItem("pixelLifeSeed"));
if (!seed) {
  seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  localStorage.setItem("pixelLifeSeed", String(seed));
}

// Los memories se cargarán dinámicamente desde el adaptador activo
export let memories = [];

// Función para cargar memories desde el adaptador activo
export async function loadMemoriesFromAdapter(persistenceAdapter) {
  if (!persistenceAdapter) {
    // Fallback a localStorage si no hay adaptador
    memories = JSON.parse(localStorage.getItem("memories") || "[]");
  } else {
    try {
      memories = await persistenceAdapter.getMemories();
    } catch (error) {
      console.error("Error cargando memories desde adaptador:", error);
      // Fallback a localStorage
      memories = JSON.parse(localStorage.getItem("memories") || "[]");
    }
  }

  // Migration: Add createdAt field to existing memories if missing
  memories.forEach((memory, index) => {
    if (!memory.createdAt) {
      // For existing memories without date, use a default date (current time)
      // This ensures all memories have a date tag
      memory.createdAt = new Date().toISOString();
    }
  });

  return memories;
}

export function setMemories(arr) {
  memories = arr;
  localStorage.setItem("memories", JSON.stringify(memories));
}

export function pushMemory(m) {
  memories.push(m);
  localStorage.setItem("memories", JSON.stringify(memories));
}

export function deleteMemoryAt(idx) {
  memories.splice(idx, 1);
  localStorage.setItem("memories", JSON.stringify(memories));
}

// Función para sincronizar memories con el adaptador activo
export async function syncMemoriesWithAdapter(persistenceAdapter) {
  if (!persistenceAdapter) return;

  try {
    // Obtener memories actuales del adaptador
    const adapterMemories = await persistenceAdapter.getMemories();

    // Actualizar la variable local si hay diferencias
    if (adapterMemories.length !== memories.length) {
      memories = adapterMemories;
      console.log(`🔄 Sincronizados ${memories.length} memories con adaptador`);
    }
  } catch (error) {
    console.error("Error sincronizando memories con adaptador:", error);
  }
}

export function setGridH(newH) {
  gridH = newH;
}
export function setGridW(newW) {
  gridW = newW;
}

export function cellCenter(x, y) {
  return { x: x * tileSize + tileSize / 2, y: y * tileSize + tileSize / 2 };
}
