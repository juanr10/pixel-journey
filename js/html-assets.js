// js/html-assets.js
// Importar imágenes que se usan directamente en el HTML para que Vite las incluya en el build
import juanImg from "../assets/sprites/memories/juan.png";
import paulaImg from "../assets/sprites/memories/paula.png";

export const htmlAssets = {
  juan: juanImg,
  paula: paulaImg,
};

// Función para actualizar las referencias de imágenes en el HTML
export function updateHtmlImageReferences() {
  // Actualizar la imagen de Juan
  const juanImgElement = document.querySelector('img[alt="Juan"]');
  if (juanImgElement) {
    juanImgElement.src = htmlAssets.juan;
  }

  // Actualizar la imagen de Paula
  const paulaImgElement = document.querySelector('img[alt="Paula"]');
  if (paulaImgElement) {
    paulaImgElement.src = htmlAssets.paula;
  }
}
