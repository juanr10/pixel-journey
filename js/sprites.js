// Importar todas las imágenes para que Vite las incluya en el build
import houseImg from "../assets/sprites/memories/house.png";
import juanImg from "../assets/sprites/memories/juan.png";
import paulaImg from "../assets/sprites/memories/paula.png";
import mountainImg from "../assets/sprites/memories/mountain.png";
import travelImg from "../assets/sprites/memories/travel.png";
import gameImg from "../assets/sprites/memories/game.png";
import loveImg from "../assets/sprites/memories/love.png";
import cameraImg from "../assets/sprites/memories/camera.png";
import museoImg from "../assets/sprites/memories/museo.png";

export const spriteUrls = {
  house: houseImg,
  juan: juanImg,
  paula: paulaImg,
  mountain: mountainImg,
  travel: travelImg,
  game: gameImg,
  love: loveImg,
  camera: cameraImg,
  museo: museoImg,
};

export const sprites = {};
export function loadSprites() {
  const entries = Object.entries(spriteUrls);
  let loaded = 0;
  return new Promise((resolve) => {
    entries.forEach(([k, u]) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (loaded === entries.length) resolve();
      };
      img.onerror = () => {
        loaded++;
        if (loaded === entries.length) resolve();
      };
      img.src = u;
      sprites[k] = img;
    });
  });
}
