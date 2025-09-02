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
        document.body.classList.add("load-game-active");
      };
    }

    // Back button (from load game screen to main menu) - REMOVED
    // No back button needed in load game screen

    // Back button (from game screen to main menu) - REMOVED
    // No back button needed globally

    // Save slot
    document.getElementById("saveSlot1").onclick = () => {
      this.checkPasswordAndLoad();
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

  checkPasswordAndLoad() {
    // Obtener la contraseña desde las variables de entorno
    const correctPassword = import.meta.env.VITE_ACCESS_PASSWORD_APP;

    // Si no hay contraseña configurada, denegar acceso
    if (!correctPassword) {
      alert(
        "❌ Access password not configured. Please set VITE_ACCESS_PASSWORD_APP in your .env file."
      );
      return;
    }

    // Solicitar contraseña al usuario
    const userPassword = prompt("🔐 Enter access password:");

    // Verificar contraseña
    if (userPassword === correctPassword) {
      // Contraseña correcta, continuar con la carga
      this.showAvatarLoading();
    } else if (userPassword === null) {
      // Usuario canceló, no hacer nada
      return;
    } else {
      // Contraseña incorrecta
      alert("❌ Incorrect password. Access denied.");
    }
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
      document.body.classList.remove("load-game-active");
      document.body.classList.remove("navigation-active");
    }, 2000);
  }

  // Transición desde loading inicial al menú principal
  transitionFromLoading() {
    // Mostrar menú principal directamente
    this.screens.mainMenu.classList.remove("hidden");
  }

  // Volver al menú principal desde la pantalla del juego
  goToMainMenu() {
    // Ocultar la aplicación principal y mostrar el menú
    document.body.classList.add("navigation-active");
    this.screens.mainMenu.classList.remove("hidden");
    this.screens.loadGame.classList.add("hidden");
  }
}
