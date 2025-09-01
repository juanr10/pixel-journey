// js/navigation.js
// Manejo de navegación entre pantallas

export class NavigationManager {
  constructor() {
    this.currentScreen = "loading";
    this.screens = {
      loading: document.getElementById("appLoadingScreen"),
      mainMenu: document.getElementById("mainMenuScreen"),
      loadGame: document.getElementById("loadGameScreen"),
    };

    this.init();
  }

  init() {
    // Event listeners para el menú principal
    const loadGameBtn = document.getElementById("loadGameBtn");
    const newGameBtn = document.getElementById("newGameBtn");
    const exitBtn = document.getElementById("exitBtn");

    if (loadGameBtn) {
      loadGameBtn.addEventListener("click", () => this.showLoadGameScreen());
    }

    if (newGameBtn) {
      newGameBtn.addEventListener("click", () => this.showNewGameMessage());
    }

    if (exitBtn) {
      exitBtn.addEventListener("click", () => this.showExitMessage());
    }

    // Event listeners para la pantalla de carga de partida
    const backToMainBtn = document.getElementById("backToMainBtn");
    const saveSlot1 = document.getElementById("saveSlot1");

    if (backToMainBtn) {
      backToMainBtn.addEventListener("click", () => this.showMainMenu());
    }

    if (saveSlot1) {
      saveSlot1.addEventListener("click", () => this.loadGame());
    }
  }

  // Mostrar pantalla de carga de partida
  showLoadGameScreen() {
    this.hideAllScreens();
    this.screens.loadGame.classList.remove("hidden");
    this.currentScreen = "loadGame";

    // Asegurar que la aplicación principal esté oculta
    document.body.classList.add("navigation-active");
  }

  // Mostrar menú principal
  showMainMenu() {
    this.hideAllScreens();
    this.screens.mainMenu.classList.remove("hidden");
    this.screens.mainMenu.classList.add("fade-in");
    this.currentScreen = "mainMenu";

    // Asegurar que la aplicación principal esté oculta
    document.body.classList.add("navigation-active");

    // Remover la clase fade-in después de la animación
    setTimeout(() => {
      this.screens.mainMenu.classList.remove("fade-in");
    }, 2000);
  }

  // Cargar partida y mostrar aplicación principal
  loadGame() {
    // Mostrar animación de carga antes de cargar la app
    this.showLoadingAnimation();

    // Después de la animación, ocultar navegación y mostrar app
    setTimeout(() => {
      this.hideNavigation();
      document.body.classList.remove("navigation-active");
      this.currentScreen = "app";
    }, 2000); // Duración de la animación
  }

  // Mostrar animación de carga
  showLoadingAnimation() {
    // Crear pantalla de carga temporal
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "navigation-overlay";
    loadingOverlay.innerHTML = `
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

    document.body.appendChild(loadingOverlay);

    // Remover después de la animación
    setTimeout(() => {
      if (loadingOverlay.parentNode) {
        loadingOverlay.parentNode.removeChild(loadingOverlay);
      }
    }, 2000);
  }

  // Ocultar navegación
  hideNavigation() {
    Object.values(this.screens).forEach((screen) => {
      if (screen && screen.classList.contains("navigation-overlay")) {
        screen.classList.add("hidden");
      }
    });
  }

  // Mostrar navegación
  showNavigation() {
    Object.values(this.screens).forEach((screen) => {
      if (screen && screen.classList.contains("navigation-overlay")) {
        screen.classList.remove("hidden");
      }
    });
  }

  // Ocultar todas las pantallas
  hideAllScreens() {
    Object.values(this.screens).forEach((screen) => {
      if (screen) {
        screen.classList.add("hidden");
      }
    });
  }

  // Mostrar mensaje para opciones no disponibles
  showNewGameMessage() {
    alert(
      "New Game feature coming soon! 🎮\n\nFor now, you can start your adventure by loading the existing save."
    );
  }

  showExitMessage() {
    alert(
      "Thanks for playing Pixel Journey! 🎮\n\nYour memories are safe and will be here when you return."
    );
  }

  // Transición desde la pantalla de carga al menú principal
  transitionFromLoading() {
    this.hideAllScreens();
    this.screens.mainMenu.classList.remove("hidden");
    this.screens.mainMenu.classList.add("fade-in");
    this.currentScreen = "mainMenu";

    // Asegurar que la aplicación principal esté oculta
    document.body.classList.add("navigation-active");

    // Remover la clase fade-in después de la animación
    setTimeout(() => {
      this.screens.mainMenu.classList.remove("fade-in");
    }, 2000);
  }

  // Obtener pantalla actual
  getCurrentScreen() {
    return this.currentScreen;
  }
}
