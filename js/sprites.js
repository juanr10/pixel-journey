export const spriteUrls = {
  house: "./assets/sprites/memories/house.png",
  juan: "./assets/sprites/memories/juan.png",
  paula: "./assets/sprites/memories/paula.png",
  mountain: "./assets/sprites/memories/mountain.png",
  travel: "./assets/sprites/memories/travel.png",
  game: "./assets/sprites/memories/game.png",
  love: "./assets/sprites/memories/love.png",
  camera: "./assets/sprites/memories/camera.png",
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
