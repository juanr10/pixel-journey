// js/loading-screen.js
// Manejo de la pantalla de carga inicial

export class LoadingScreen {
  constructor() {
    this.loadingScreen = document.getElementById("appLoadingScreen");
    this.progressText = document.getElementById("loadingProgress");
    this.isVisible = true;
  }

  // Actualizar mensaje de progreso
  updateProgress(message) {
    if (this.progressText) {
      this.progressText.textContent = message;
    }
  }

  // Ocultar pantalla de carga
  hide() {
    if (this.loadingScreen && this.isVisible) {
      this.loadingScreen.classList.add("hidden");
      this.isVisible = false;

      // Remover del DOM después de la animación
      setTimeout(() => {
        if (this.loadingScreen && this.loadingScreen.parentNode) {
          this.loadingScreen.parentNode.removeChild(this.loadingScreen);
        }
      }, 500); // Coincide con la duración de la transición CSS
    }
  }

  // Mostrar pantalla de carga (por si se necesita)
  show() {
    if (this.loadingScreen && !this.isVisible) {
      this.loadingScreen.classList.remove("hidden");
      this.isVisible = true;
    }
  }
}

// Función para simular el proceso de carga
export async function simulateLoadingProcess() {
  // Delay muy corto para ir rápido al menú principal
  await new Promise((resolve) => setTimeout(resolve, 500));
}
