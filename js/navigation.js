// js/navigation.js
// Navegación SIMPLE - Solo mostrar/ocultar pantallas

export class NavigationManager {
  constructor() {
    this.screens = {
      loading: document.getElementById("appLoadingScreen"),
      mainMenu: document.getElementById("mainMenuScreen"),
      loadGame: document.getElementById("loadGameScreen"),
    };
    this.init();
  }

  init() {
    // Load Game button
    const loadGameBtn = document.getElementById("loadGameBtn");
    if (loadGameBtn) {
      loadGameBtn.onclick = () => {
        this.screens.mainMenu.classList.add("hidden");
        this.screens.loadGame.classList.remove("hidden");
      };
    }

    // Back button
    document.getElementById("backToMainBtn").onclick = () => {
      this.screens.loadGame.classList.add("hidden");
      this.screens.mainMenu.classList.remove("hidden");
    };

    // Save slot
    document.getElementById("saveSlot1").onclick = () => {
      this.showAvatarLoading();
    };

    // New Game button
    document.getElementById("newGameBtn").onclick = () => {
      alert("New Game feature coming soon! 🎮");
    };

    // Exit button
    document.getElementById("exitBtn").onclick = () => {
      alert("Thanks for playing Pixel Journey! 🎮");
    };
  }

  showAvatarLoading() {
    // Crear pantalla de carga temporal
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "navigation-overlay";
    loadingDiv.innerHTML = `
      <h1 class="app-loading-title">Loading Adventure...</h1>
      <p class="app-loading-subtitle">Preparing your memories...</p>
      <div class="avatar-spinner">
        <div class="avatar-item">✈️</div>
        <div class="avatar-item">🏔️</div>
        <div class="avatar-item">🎮</div>
        <div class="avatar-item">❤️</div>
        <div class="avatar-item">📸</div>
        <div class="avatar-item">🏛️</div>
      </div>
    `;

    document.body.appendChild(loadingDiv);

    // Después de 2 segundos, mostrar app principal
    setTimeout(() => {
      document.body.removeChild(loadingDiv);
      this.screens.mainMenu.classList.add("hidden");
      this.screens.loadGame.classList.add("hidden");
      document.body.classList.remove("navigation-active");
    }, 2000);
  }

  // Transición desde loading inicial al menú principal
  transitionFromLoading() {
    // Mostrar menú principal directamente
    this.screens.mainMenu.classList.remove("hidden");
  }
}
