// js/examples/game-integration-example.js
// Ejemplo de cómo integrar el sistema de memories con el juego existente

import { PersistenceAdapter } from "../adapters/persistence-adapter.js";

// Ejemplo de integración con el juego existente
export class GameIntegrationExample {
  constructor() {
    this.persistenceAdapter = new PersistenceAdapter();
    this.memories = [];
    this.paths = [];
    this.isInitialized = false;
    this.memoryMarkers = new Map(); // Para rastrear marcadores en el mapa
    this.pathLines = new Map(); // Para rastrear líneas de path en el mapa
  }

  // Inicializar el sistema
  async init() {
    try {
      // Inicializar adaptador de persistencia
      await this.persistenceAdapter.init();

      // Cargar datos existentes
      await this.loadExistingData();

      // Configurar listeners para cambios en tiempo real
      this.setupRealTimeListeners();

      this.isInitialized = true;
      console.log("GameIntegrationExample initialized successfully");
    } catch (error) {
      console.error("Error initializing GameIntegrationExample:", error);
      throw error;
    }
  }

  // Cargar datos existentes
  async loadExistingData() {
    try {
      // Cargar memories
      this.memories = await this.persistenceAdapter.getMemories();
      console.log(`${this.memories.length} memories cargados`);

      // Cargar paths
      this.paths = await this.persistenceAdapter.getAllPaths();
      console.log(`${this.paths.length} paths cargados`);

      // Renderizar en el mapa
      this.renderMemoriesOnMap();
      this.renderPathsOnMap();
    } catch (error) {
      console.error("Error cargando datos existentes:", error);
    }
  }

  // Configurar listeners en tiempo real
  setupRealTimeListeners() {
    // Solo si estamos usando Firebase
    if (this.persistenceAdapter.getActiveAdapterInfo().type === "firebase") {
      this.setupFirebaseListeners();
    }
  }

  // Configurar listeners de Firebase para cambios en tiempo real
  setupFirebaseListeners() {
    try {
      // Listener para memories
      this.persistenceAdapter.onMemoriesChange((memories) => {
        console.log("Memories actualizados en tiempo real:", memories);
        this.memories = memories;
        this.renderMemoriesOnMap();
      });

      // Listener para paths
      this.persistenceAdapter.onPathsChange((paths) => {
        console.log("Paths actualizados en tiempo real:", paths);
        this.paths = paths;
        this.renderPathsOnMap();
      });
    } catch (error) {
      console.warn(
        "No se pudieron configurar listeners en tiempo real:",
        error
      );
    }
  }

  // Renderizar memories en el mapa
  renderMemoriesOnMap() {
    // Limpiar marcadores existentes
    this.clearMemoryMarkers();

    // Renderizar cada memory
    this.memories.forEach((memory) => {
      this.renderMemoryOnMap(memory);
    });
  }

  // Renderizar un memory específico en el mapa
  renderMemoryOnMap(memory) {
    try {
      // Crear marcador visual
      const marker = this.createMemoryMarker(memory);

      // Posicionar en el mapa según las coordenadas del memory
      const position = this.calculateMapPosition(memory.position);
      this.positionMarker(marker, position);

      // Añadir al mapa
      this.addMarkerToMap(marker);

      // Guardar referencia
      this.memoryMarkers.set(memory.id, marker);

      console.log(
        `Memory renderizado: ${memory.title} en posición ${position.x}, ${position.y}`
      );
    } catch (error) {
      console.error(`Error renderizando memory ${memory.id}:`, error);
    }
  }

  // Crear marcador visual para un memory
  createMemoryMarker(memory) {
    const marker = document.createElement("div");
    marker.className = "memory-marker";
    marker.dataset.memoryId = memory.id;

    // Estilo del marcador
    marker.style.cssText = `
      position: absolute;
      width: 24px;
      height: 24px;
      background: ${this.getMemoryTypeColor(memory.type)};
      border: 2px solid white;
      border-radius: 50%;
      cursor: pointer;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
    `;

    // Icono según el tipo
    const icon = this.getMemoryTypeIcon(memory.type);
    marker.innerHTML = icon;

    // Tooltip con información básica
    marker.title = `${memory.title}\n${
      memory.type
    }\n${memory.description?.substring(0, 50)}...`;

    // Event listeners
    marker.addEventListener("click", () => this.onMemoryMarkerClick(memory));
    marker.addEventListener("mouseenter", () =>
      this.onMemoryMarkerHover(marker, memory)
    );
    marker.addEventListener("mouseleave", () =>
      this.onMemoryMarkerLeave(marker)
    );

    return marker;
  }

  // Obtener color según el tipo de memory
  getMemoryTypeColor(type) {
    const colors = {
      love: "#e91e63",
      travel: "#2196f3",
      game: "#4caf50",
      house: "#ff9800",
      mountain: "#795548",
      museo: "#9c27b0",
      camera: "#607d8b",
      paula: "#ff5722",
      juan: "#3f51b5",
    };

    return colors[type] || "#666";
  }

  // Obtener icono según el tipo de memory
  getMemoryTypeIcon(type) {
    const icons = {
      love: "❤️",
      travel: "✈️",
      game: "🎮",
      house: "🏠",
      mountain: "⛰️",
      museo: "🏛️",
      camera: "📷",
      paula: "👩",
      juan: "👨",
    };

    return icons[type] || "📍";
  }

  // Calcular posición en el mapa
  calculateMapPosition(memoryPosition) {
    // Convertir coordenadas del memory a coordenadas del mapa
    // Esto dependerá de cómo esté estructurado tu sistema de coordenadas

    // Por ahora, asumimos que las coordenadas son relativas al canvas del juego
    const gameCanvas = document.querySelector(
      "#game-canvas, canvas, .game-area"
    );
    if (gameCanvas) {
      const rect = gameCanvas.getBoundingClientRect();
      return {
        x: (memoryPosition.x / 100) * rect.width,
        y: (memoryPosition.y / 100) * rect.height,
      };
    }

    // Fallback: usar coordenadas absolutas
    return {
      x: memoryPosition.x,
      y: memoryPosition.y,
    };
  }

  // Posicionar marcador en el mapa
  positionMarker(marker, position) {
    marker.style.left = `${position.x - 12}px`; // Centrar el marcador
    marker.style.top = `${position.y - 12}px`;
  }

  // Añadir marcador al mapa
  addMarkerToMap(marker) {
    // Buscar el contenedor del mapa del juego
    const mapContainer = document.querySelector(
      "#game-container, .game-container, .map-container, #game-canvas, canvas"
    );

    if (mapContainer) {
      // Si es un canvas, añadir como overlay
      if (mapContainer.tagName === "CANVAS") {
        const overlay = this.getOrCreateOverlay(mapContainer);
        overlay.appendChild(marker);
      } else {
        mapContainer.appendChild(marker);
      }
    } else {
      // Fallback: añadir al body
      document.body.appendChild(marker);
    }
  }

  // Obtener o crear overlay para canvas
  getOrCreateOverlay(canvas) {
    let overlay = canvas.parentNode.querySelector(".game-overlay");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "game-overlay";
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
      `;

      // Insertar después del canvas
      canvas.parentNode.insertBefore(overlay, canvas.nextSibling);
    }

    return overlay;
  }

  // Renderizar paths en el mapa
  renderPathsOnMap() {
    // Limpiar líneas existentes
    this.clearPathLines();

    // Renderizar cada path
    this.paths.forEach((path) => {
      this.renderPathOnMap(path);
    });
  }

  // Renderizar un path específico en el mapa
  renderPathOnMap(path) {
    try {
      // Crear línea visual del path
      const pathLine = this.createPathLine(path);

      // Añadir al mapa
      this.addPathLineToMap(pathLine);

      // Guardar referencia
      this.pathLines.set(path.id, pathLine);

      console.log(`Path renderizado: ${path.name || path.id}`);
    } catch (error) {
      console.error(`Error renderizando path ${path.id}:`, error);
    }
  }

  // Crear línea visual para un path
  createPathLine(path) {
    const pathLine = document.createElement("div");
    pathLine.className = "path-line";
    pathLine.dataset.pathId = path.id;

    // Crear SVG para la línea
    const svg = this.createPathSVG(path);
    pathLine.appendChild(svg);

    // Estilo del contenedor
    pathLine.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 500;
    `;

    return pathLine;
  }

  // Crear SVG para el path
  createPathSVG(path) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
    `;

    // Crear path SVG
    const pathElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

    // Convertir puntos del path a formato SVG
    const pathData = this.convertPathToSVG(path.points);
    pathElement.setAttribute("d", pathData);
    pathElement.setAttribute("stroke", "#ff6b6b");
    pathElement.setAttribute("stroke-width", "3");
    pathElement.setAttribute("fill", "none");
    pathElement.setAttribute("stroke-linecap", "round");
    pathElement.setAttribute("stroke-linejoin", "round");
    pathElement.style.opacity = "0.7";

    svg.appendChild(pathElement);
    return svg;
  }

  // Convertir puntos del path a formato SVG
  convertPathToSVG(points) {
    if (!points || points.length === 0) return "";

    // Convertir coordenadas a formato SVG
    const svgPoints = points.map((point, index) => {
      const position = this.calculateMapPosition(point);
      return `${index === 0 ? "M" : "L"} ${position.x} ${position.y}`;
    });

    return svgPoints.join(" ");
  }

  // Añadir línea de path al mapa
  addPathLineToMap(pathLine) {
    const mapContainer = document.querySelector(
      "#game-container, .game-container, .map-container"
    );

    if (mapContainer) {
      mapContainer.appendChild(pathLine);
    } else {
      document.body.appendChild(pathLine);
    }
  }

  // Event handlers para marcadores
  onMemoryMarkerClick(memory) {
    console.log("Memory clickeado:", memory);

    // Mostrar información del memory
    this.showMemoryInfo(memory);

    // Opcional: centrar el mapa en la posición del memory
    this.centerMapOnMemory(memory);
  }

  onMemoryMarkerHover(marker, memory) {
    // Añadir efecto hover
    marker.style.transform = "scale(1.2)";
    marker.style.boxShadow = "0 4px 8px rgba(0,0,0,0.4)";

    // Mostrar tooltip mejorado
    this.showEnhancedTooltip(marker, memory);
  }

  onMemoryMarkerLeave(marker) {
    // Remover efecto hover
    marker.style.transform = "scale(1)";
    marker.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

    // Ocultar tooltip
    this.hideEnhancedTooltip();
  }

  // Mostrar información del memory
  showMemoryInfo(memory) {
    // Crear modal o panel de información
    const infoPanel = this.createMemoryInfoPanel(memory);

    // Mostrar en pantalla
    document.body.appendChild(infoPanel);

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      if (infoPanel.parentNode) {
        infoPanel.parentNode.removeChild(infoPanel);
      }
    }, 5000);
  }

  // Crear panel de información del memory
  createMemoryInfoPanel(memory) {
    const panel = document.createElement("div");
    panel.className = "memory-info-panel";

    // Contenido del panel
    panel.innerHTML = `
      <div class="memory-info-header">
        <h3>${memory.title}</h3>
        <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="memory-info-content">
        <p><strong>Tipo:</strong> ${memory.type}</p>
        <p><strong>Descripción:</strong> ${
          memory.description || "Sin descripción"
        }</p>
        <p><strong>Fecha:</strong> ${new Date(
          memory.createdAt
        ).toLocaleDateString()}</p>
        ${
          memory.images && memory.images.length > 0
            ? `<p><strong>Imágenes:</strong> ${memory.images.length} foto(s)</p>`
            : ""
        }
      </div>
      <div class="memory-info-actions">
        <button onclick="gameIntegration.editMemory('${
          memory.id
        }')">Editar</button>
        <button onclick="gameIntegration.deleteMemory('${
          memory.id
        }')">Eliminar</button>
      </div>
    `;

    // Estilos del panel
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
    `;

    return panel;
  }

  // Centrar mapa en la posición del memory
  centerMapOnMemory(memory) {
    // Implementar según tu sistema de navegación del mapa
    console.log("Centrando mapa en memory:", memory.position);
  }

  // Mostrar tooltip mejorado
  showEnhancedTooltip(marker, memory) {
    // Implementar tooltip mejorado si es necesario
  }

  // Ocultar tooltip mejorado
  hideEnhancedTooltip() {
    // Implementar ocultación de tooltip si es necesario
  }

  // Limpiar marcadores de memories
  clearMemoryMarkers() {
    this.memoryMarkers.forEach((marker) => {
      if (marker.parentNode) {
        marker.parentNode.removeChild(marker);
      }
    });
    this.memoryMarkers.clear();
  }

  // Limpiar líneas de paths
  clearPathLines() {
    this.pathLines.forEach((line) => {
      if (line.parentNode) {
        line.parentNode.removeChild(line);
      }
    });
    this.pathLines.clear();
  }

  // Crear nuevo memory desde el juego
  async createMemoryFromGame(memoryData) {
    try {
      const memoryId = await this.persistenceAdapter.createMemory(memoryData);
      console.log("Memory creado desde el juego:", memoryId);

      // Actualizar lista local
      const newMemory = await this.persistenceAdapter.getMemoryById(memoryId);
      this.memories.push(newMemory);

      // Renderizar en el mapa
      this.renderMemoryOnMap(newMemory);

      return memoryId;
    } catch (error) {
      console.error("Error creando memory desde el juego:", error);
      throw error;
    }
  }

  // Editar memory
  async editMemory(memoryId) {
    try {
      const memory = await this.persistenceAdapter.getMemoryById(memoryId);
      console.log("Editando memory:", memory);

      // Aquí podrías abrir un formulario de edición
      // Por ahora solo logueamos
    } catch (error) {
      console.error("Error editando memory:", error);
      throw error;
    }
  }

  // Eliminar memory
  async deleteMemory(memoryId) {
    try {
      await this.persistenceAdapter.deleteMemory(memoryId);
      console.log("Memory eliminado:", memoryId);

      // Remover de lista local
      this.memories = this.memories.filter((m) => m.id !== memoryId);

      // Remover marcador del mapa
      const marker = this.memoryMarkers.get(memoryId);
      if (marker && marker.parentNode) {
        marker.parentNode.removeChild(marker);
        this.memoryMarkers.delete(memoryId);
      }
    } catch (error) {
      console.error("Error eliminando memory:", error);
      throw error;
    }
  }

  // Obtener memories en una área específica
  getMemoriesInArea(area) {
    return this.memories.filter((memory) => {
      const pos = memory.position;
      return (
        pos.x >= area.x1 &&
        pos.x <= area.x2 &&
        pos.y >= area.y1 &&
        pos.y <= area.y2
      );
    });
  }

  // Obtener memories por tipo
  getMemoriesByType(type) {
    return this.memories.filter((memory) => memory.type === type);
  }

  // Obtener memories por fecha
  getMemoriesByDate(startDate, endDate) {
    return this.memories.filter((memory) => {
      const memoryDate = new Date(memory.createdAt);
      return memoryDate >= startDate && memoryDate <= endDate;
    });
  }

  // Obtener estadísticas
  getStats() {
    const stats = {
      totalMemories: this.memories.length,
      totalPaths: this.paths.length,
      memoriesByType: {},
      totalImages: 0,
      averageImagesPerMemory: 0,
    };

    // Contar por tipo
    this.memories.forEach((memory) => {
      const type = memory.type;
      stats.memoriesByType[type] = (stats.memoriesByType[type] || 0) + 1;

      // Contar imágenes
      if (memory.images) {
        stats.totalImages += memory.images.length;
      }
    });

    // Calcular promedio
    if (stats.totalMemories > 0) {
      stats.averageImagesPerMemory = stats.totalImages / stats.totalMemories;
    }

    return stats;
  }

  // Limpiar recursos
  async destroy() {
    // Limpiar marcadores y líneas
    this.clearMemoryMarkers();
    this.clearPathLines();

    // Limpiar listeners
    if (this.persistenceAdapter) {
      await this.persistenceAdapter.destroy();
    }

    this.isInitialized = false;
  }
}

// Función de inicialización global
export async function initGameIntegration() {
  const integration = new GameIntegrationExample();
  await integration.init();

  // Hacer disponible globalmente
  window.gameIntegration = integration;

  return integration;
}
