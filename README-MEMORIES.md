# Sistema de Memories con Firebase para PixelLife

## 🎯 Características

- ✅ **Persistencia en Firebase**: Memories y paths guardados en la nube
- ✅ **Gestión de imágenes**: Subida, compresión automática y vista previa
- ✅ **Sistema de paths**: Dibujo y persistencia de trazos
- ✅ **Interfaz moderna**: Modal para crear/editar memories
- ✅ **Tiempo real**: Sincronización automática entre dispositivos
- ✅ **Migración automática**: Desde localStorage a Firebase
- ✅ **Responsive**: Funciona en móvil y desktop

## 🚀 Instalación

### 1. Configurar Firebase

Sigue las instrucciones en `firebase-setup.md` para:
- Crear proyecto en Firebase
- Habilitar Firestore y Storage
- Obtener credenciales de configuración

### 2. Actualizar configuración

En `js/firebase-config.js`, reemplaza la configuración con la tuya:

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key-real",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "tu-sender-id",
  appId: "tu-app-id"
};
```

### 3. Integrar en tu juego

En tu archivo principal (ej: `main.js`):

```javascript
import { initMemorySystem } from './memory-integration-example.js';

window.addEventListener('DOMContentLoaded', async () => {
  // ... tu código existente ...
  
  // Inicializar sistema de memories
  try {
    await initMemorySystem();
    console.log('Memory system ready!');
  } catch (error) {
    console.error('Failed to initialize memory system:', error);
  }
});
```

## 📁 Estructura de archivos

```
js/
├── firebase-config.js          # Configuración y funciones de Firebase
├── image-manager.js            # Gestión de imágenes (upload, preview, delete)
├── path-persistence.js         # Persistencia de paths/trazos
├── memory-manager.js           # Gestión CRUD de memories
├── memory-ui.js                # Interfaz de usuario
├── memory-styles.js            # Estilos CSS
└── memory-integration-example.js # Ejemplo de integración
```

## 🎮 Uso

### Crear un Memory

1. **Hacer clic en una celda vacía** del mapa
2. **Seleccionar tipo** (cámara, juego, casa, etc.)
3. **Añadir título y descripción** (opcional)
4. **Subir imágenes** arrastrando o haciendo clic
5. **Dibujar path** (opcional)
6. **Guardar**

### Gestionar Memories

- **Lista lateral derecha**: Ver todos los memories
- **Botón "✏️"**: Editar memory existente
- **Botón "🗑️"**: Eliminar memory
- **Iconos en el mapa**: Ver memories existentes

### Subir Imágenes

- **Drag & Drop**: Arrastrar imágenes a la zona
- **Click**: Seleccionar archivos del explorador
- **Compresión automática**: Se optimizan antes de subir
- **Vista previa**: Ver imágenes antes de guardar
- **Eliminación individual**: Borrar imágenes específicas

### Dibujar Paths

1. **Seleccionar memory** (editar o crear nuevo)
2. **Hacer clic en "Iniciar Path"**
3. **Dibujar** en el mapa
4. **Hacer clic en "Finalizar Path"**
5. **Path se guarda** automáticamente

## 🔧 Configuración

### Tipos de Memory disponibles

```javascript
const memoryTypes = {
  camera: '📷 Cámara',
  game: '🎮 Juego', 
  house: '🏠 Casa',
  juan: '👨 Juan',
  love: '💕 Amor',
  mountain: '⛰️ Montaña',
  museo: '🏛️ Museo',
  paula: '👩 Paula',
  travel: '✈️ Viaje'
};
```

### Personalizar estilos

Edita `js/memory-styles.js` para cambiar:
- Colores y fuentes
- Tamaños y espaciados
- Animaciones y transiciones
- Responsive breakpoints

### Configurar límites

En `js/firebase-config.js`:

```javascript
// Tamaño máximo de imagen (píxeles)
const maxSize = 800;

// Calidad de compresión (0.1 - 1.0)
const quality = 0.8;

// Tamaño máximo de archivo (bytes)
const maxFileSize = 5 * 1024 * 1024; // 5MB
```

## 📊 Estructura de datos

### Memory en Firestore

```javascript
{
  id: "auto-generado",
  userId: "default_user",
  type: "camera",
  position: { x: 5, y: 3 },
  title: "Vacaciones en la montaña",
  description: "Un día increíble escalando",
  images: [
    {
      id: "img_123",
      url: "https://...",
      filename: "montaña.jpg",
      uploadedAt: "2024-01-15T10:30:00Z",
      metadata: { size: 1024000, type: "image/jpeg" }
    }
  ],
  metadata: {},
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Path en Firestore

```javascript
{
  id: "auto-generado",
  memoryId: "memory_123",
  userId: "default_user",
  points: [
    { x: 100, y: 200 },
    { x: 150, y: 250 }
  ],
  style: {
    color: "#FF0000",
    width: 2
  },
  timestamp: "2024-01-15T10:30:00Z",
  createdAt: "2024-01-15T10:30:00Z"
}
```

## 🔌 API del MemoryManager

### Métodos principales

```javascript
// Obtener instancia
const memoryManager = window.memorySystem.memoryManager;

// Crear memory
const memoryId = await memoryManager.createMemory({
  type: 'camera',
  position: { x: 5, y: 3 },
  title: 'Mi memory',
  description: 'Descripción'
});

// Obtener memories
const memories = memoryManager.memories;

// Actualizar memory
await memoryManager.updateMemory(memoryId, {
  title: 'Nuevo título'
});

// Eliminar memory
await memoryManager.deleteMemory(memoryId);

// Obtener estadísticas
const stats = memoryManager.getStats();
```

### Eventos disponibles

```javascript
// Cuando se actualizan memories
memoryManager.onMemoriesUpdate((memories) => {
  console.log('Memories actualizados:', memories);
});

// Cuando se selecciona un memory
memoryManager.onMemorySelect((memory) => {
  console.log('Memory seleccionado:', memory);
});

// Cuando se elimina un memory
memoryManager.onMemoryDelete((memoryId) => {
  console.log('Memory eliminado:', memoryId);
});
```

## 🎨 Personalización

### Cambiar iconos de tipos

En `js/memory-ui.js`, edita el objeto `icons`:

```javascript
getMemoryIcon(type) {
  const icons = {
    camera: '📷',
    game: '🎮',
    // ... personalizar aquí
  };
  return icons[type] || '💭';
}
```

### Cambiar nombres de tipos

```javascript
getMemoryTypeName(type) {
  const names = {
    camera: 'Cámara',
    game: 'Juego',
    // ... personalizar aquí
  };
  return names[type] || type;
}
```

### Añadir nuevos tipos

1. **Actualizar select** en `js/memory-ui.js`
2. **Añadir icono** en `getMemoryIcon()`
3. **Añadir nombre** en `getMemoryTypeName()`
4. **Actualizar colores** en `js/poi.js` si es necesario

## 🐛 Solución de problemas

### Error: "Firebase not initialized"

- Verifica que `firebase-config.js` esté configurado correctamente
- Asegúrate de que las credenciales sean válidas
- Revisa la consola del navegador para errores

### Error: "Permission denied"

- Verifica las reglas de Firestore y Storage
- Asegúrate de que estén en modo de prueba
- Revisa que el proyecto esté activo

### Imágenes no se suben

- Verifica la conexión a internet
- Revisa el tamaño del archivo (máx. 5MB)
- Verifica las reglas de Storage
- Revisa la consola para errores específicos

### Memories no se cargan

- Verifica la conexión a Firestore
- Revisa las reglas de Firestore
- Verifica que la colección exista
- Revisa la consola para errores

## 📱 Responsive Design

El sistema se adapta automáticamente:

- **Desktop**: Lista lateral derecha, modal completo
- **Móvil**: Lista superior, modal optimizado
- **Touch**: Soporte para gestos táctiles
- **Scroll**: Navegación optimizada para móvil

## 🔒 Seguridad

### Modo desarrollo (actual)

```javascript
// Firestore: Acceso total
allow read, write: if true;

// Storage: Acceso total  
allow read, write: if true;
```

### Para producción

```javascript
// Firestore: Solo usuarios autenticados
allow read, write: if request.auth != null;

// Storage: Solo usuarios autenticados
allow read, write: if request.auth != null;
```

## 📈 Monitoreo

### Firebase Console

- **Firestore**: Ver documentos y consultas
- **Storage**: Ver archivos y uso
- **Analytics**: Uso de la aplicación (si está habilitado)

### Métricas disponibles

```javascript
const stats = memoryManager.getStats();
console.log('Total memories:', stats.total);
console.log('Por tipo:', stats.byType);
console.log('Con imágenes:', stats.withImages);
console.log('Con paths:', stats.withPaths);
```

## 🚀 Próximas mejoras

- [ ] **Autenticación de usuarios** (Google, email)
- [ ] **Compartir memories** entre usuarios
- [ ] **Categorías personalizadas** para memories
- [ ] **Búsqueda y filtros** avanzados
- [ ] **Exportar/importar** memories
- [ **Sincronización offline** con Service Workers
- [ ] **Notificaciones push** para nuevos memories
- [ ] **Analytics avanzados** de uso

## 📞 Soporte

Si tienes problemas:

1. **Revisa la consola** del navegador
2. **Verifica la configuración** de Firebase
3. **Revisa las reglas** de seguridad
4. **Consulta la documentación** de Firebase
5. **Abre un issue** en el repositorio

## 📄 Licencia

Este código es parte del proyecto PixelLife y está bajo la misma licencia.

---

**¡Disfruta creando y compartiendo tus memories! 🎉**
