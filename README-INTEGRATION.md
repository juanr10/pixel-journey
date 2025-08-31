# 🎮 PixelLife - Sistema de Memories Integrado

Sistema completo de gestión de memories y paths para tu juego PixelLife, con persistencia configurable (LocalStorage/Firebase) y gestión de imágenes.

## 🚀 Características Principales

- **Persistencia Configurable**: Cambia entre LocalStorage y Firebase con una variable de entorno
- **Gestión de Imágenes**: Subida, compresión automática, vista previa y eliminación individual
- **Sistema de Paths**: Trazado y persistencia de rutas asociadas a memories
- **Integración con Formularios**: Fácil integración en formularios existentes
- **Renderizado en Mapa**: Visualización de memories y paths en el juego
- **Tiempo Real**: Sincronización automática con Firebase
- **Migración Automática**: Transfiere datos existentes de LocalStorage a Firebase

## 📁 Estructura del Proyecto

```
js/
├── adapters/
│   ├── persistence-adapter.js      # Adaptador principal de persistencia
│   ├── local-storage-adapter.js    # Implementación para LocalStorage
│   └── firebase-adapter.js         # Implementación para Firebase
├── components/
│   └── image-selector.js           # Selector de imágenes reutilizable
├── config/
│   └── persistence-config.js       # Configuración centralizada
├── examples/
│   ├── form-integration-example.js # Integración con formularios
│   └── game-integration-example.js # Integración con el juego
└── firebase/
    └── firebase-adapter.js         # Adaptador específico de Firebase
```

## 🛠️ Instalación y Configuración

### 1. Configurar Variables de Entorno

Copia `env.example` a `.env` y configura:

```bash
# Tipo de persistencia: localStorage, firebase, hybrid
VITE_PERSISTENCE_TYPE=localStorage

# Configuración de Firebase (solo si usas firebase o hybrid)
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 2. Configurar Firebase (Opcional)

Si usas Firebase, sigue las instrucciones en `firebase-setup.md`:

1. Crear proyecto en Firebase Console
2. Habilitar Firestore Database
3. Habilitar Storage
4. Configurar reglas de seguridad
5. Obtener credenciales

### 3. Incluir Scripts en tu HTML

```html
<!-- En tu index.html -->
<script type="module">
  import { initFormIntegration } from './js/examples/form-integration-example.js';
  import { initGameIntegration } from './js/examples/game-integration-example.js';

  window.addEventListener('DOMContentLoaded', async () => {
    try {
      // Inicializar integración con formularios
      const formIntegration = await initFormIntegration();
      
      // Inicializar integración con el juego
      const gameIntegration = await initGameIntegration();
      
      console.log('Sistema de memories inicializado correctamente');
      
    } catch (error) {
      console.error('Error inicializando sistema de memories:', error);
    }
  });
</script>
```

## 🔧 Uso Básico

### Integración con Formularios

```javascript
// Integrar selector de imágenes en formulario existente
formIntegration.integrateInMemoryForm();

// O integrar en formulario personalizado
formIntegration.integrateInCustomForm('#my-form', {
  maxFiles: 5,
  showPreview: true
});
```

### Integración con el Juego

```javascript
// Crear memory desde el juego
const memoryId = await gameIntegration.createMemoryFromGame({
  type: 'game',
  title: 'Nuevo logro',
  description: 'Completé el nivel 5',
  position: { x: 50, y: 75 }
});

// Obtener memories por tipo
const gameMemories = gameIntegration.getMemoriesByType('game');

// Obtener estadísticas
const stats = gameIntegration.getStats();
```

## 📝 API de Persistencia

### Operaciones Básicas

```javascript
// Obtener instancia del adaptador
const persistence = new PersistenceAdapter();
await persistence.init();

// Memories
const memoryId = await persistence.createMemory(memoryData);
const memory = await persistence.getMemoryById(memoryId);
const allMemories = await persistence.getAllMemories();
await persistence.updateMemory(memoryId, updateData);
await persistence.deleteMemory(memoryId);

// Paths
const pathId = await persistence.createPath(pathData);
const path = await persistence.getPathById(pathId);
const allPaths = await persistence.getAllPaths();
await persistence.updatePath(pathId, updateData);
await persistence.deletePath(pathId);

// Imágenes
const imageData = await persistence.uploadImage(file, memoryId);
await persistence.deleteImage(imageId, memoryId);
```

### Cambiar Tipo de Persistencia

```javascript
// Cambiar a Firebase
await persistence.switchPersistenceType('firebase');

// Cambiar a LocalStorage
await persistence.switchPersistenceType('localStorage');

// Modo híbrido (ambos)
await persistence.switchPersistenceType('hybrid');
```

## 🎨 Componente ImageSelector

### Uso Básico

```javascript
import { ImageSelector } from './js/components/image-selector.js';

const container = document.getElementById('image-container');
const imageSelector = new ImageSelector(container, {
  maxFiles: 5,
  showPreview: true,
  onImageSelect: (imageData) => {
    console.log('Imagen seleccionada:', imageData);
  },
  onImageRemove: (imageData) => {
    console.log('Imagen eliminada:', imageData);
  }
});
```

### Opciones de Configuración

```javascript
const options = {
  maxFiles: 10,                    // Máximo número de archivos
  showPreview: true,               // Mostrar vista previa
  maxFileSize: 5 * 1024 * 1024,   // Tamaño máximo por archivo (5MB)
  allowedTypes: ['image/*'],       // Tipos de archivo permitidos
  compressionQuality: 0.8,         // Calidad de compresión (0-1)
  onImageSelect: callback,         // Callback al seleccionar imagen
  onImageRemove: callback,         // Callback al eliminar imagen
  onError: callback                // Callback de errores
};
```

## 🔄 Migración de Datos

### Migración Automática

El sistema detecta automáticamente datos existentes en LocalStorage y los migra a Firebase:

```javascript
// Se ejecuta automáticamente al inicializar
await persistence.init();

// O migrar manualmente
await persistence.migrateFromLocalStorage();
```

### Verificar Estado de Migración

```javascript
const migrationStatus = await persistence.getMigrationStatus();
console.log('Estado de migración:', migrationStatus);
```

## 📊 Monitoreo y Debug

### Configuración de Debug

```javascript
import { debugConfig } from './js/config/persistence-config.js';

// Mostrar configuración actual
debugConfig();

// Verificar estado del adaptador activo
const adapterInfo = persistence.getActiveAdapterInfo();
console.log('Adaptador activo:', adapterInfo);
```

### Estadísticas de Uso

```javascript
const stats = await persistence.getUsageStats();
console.log('Estadísticas:', stats);
```

## 🎯 Casos de Uso Comunes

### 1. Crear Memory con Imágenes

```javascript
// 1. Integrar selector en formulario
formIntegration.integrateInMemoryForm();

// 2. El usuario selecciona imágenes y llena el formulario
// 3. Al enviar, se crea el memory y se suben las imágenes automáticamente
```

### 2. Editar Memory Existente

```javascript
// 1. Cargar memory existente
const memory = await persistence.getMemoryById(memoryId);

// 2. Integrar selector con imágenes existentes
formIntegration.integrateInEditForm(memoryId);

// 3. El usuario puede añadir/eliminar imágenes
// 4. Al guardar, se actualiza el memory y se suben nuevas imágenes
```

### 3. Visualizar Memories en el Juego

```javascript
// 1. Inicializar integración del juego
const gameIntegration = await initGameIntegration();

// 2. Los memories se renderizan automáticamente en el mapa
// 3. El usuario puede hacer clic en los marcadores para ver detalles
```

### 4. Cambiar entre LocalStorage y Firebase

```javascript
// Cambiar a Firebase
await persistence.switchPersistenceType('firebase');

// Los datos se migran automáticamente
// El sistema continúa funcionando sin interrupciones
```

## 🚨 Solución de Problemas

### Error: "Firebase not initialized"

**Causa**: Firebase no está configurado correctamente.

**Solución**:
1. Verificar variables de entorno en `.env`
2. Verificar configuración de Firebase
3. Usar `debugConfig()` para verificar configuración

### Error: "Image upload failed"

**Causa**: Problemas con Firebase Storage o LocalStorage.

**Solución**:
1. Verificar reglas de Firebase Storage
2. Verificar espacio disponible en LocalStorage
3. Verificar tamaño y tipo de archivo

### Error: "Persistence adapter not found"

**Causa**: Tipo de persistencia no válido.

**Solución**:
1. Verificar `VITE_PERSISTENCE_TYPE` en `.env`
2. Valores válidos: `localStorage`, `firebase`, `hybrid`

### Performance: "Slow image loading"

**Causa**: Imágenes muy grandes o conexión lenta.

**Solución**:
1. Ajustar `compressionQuality` en ImageSelector
2. Reducir `maxFileSize`
3. Usar Firebase para mejor CDN

## 🔒 Seguridad

### Firebase Security Rules

```javascript
// Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /memories/{memoryId} {
      allow read, write: if true; // Para desarrollo
    }
    match /paths/{pathId} {
      allow read, write: if true; // Para desarrollo
    }
  }
}

// Storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /memories/{memoryId}/{imageId} {
      allow read, write: if true; // Para desarrollo
    }
  }
}
```

### Variables de Entorno

- **Nunca** committear archivo `.env` al repositorio
- Usar `env.example` como plantilla
- Rotar credenciales regularmente en producción

## 📈 Escalabilidad

### Modo Híbrido

El modo híbrido permite usar ambos sistemas simultáneamente:

```javascript
// Configurar modo híbrido
VITE_PERSISTENCE_TYPE=hybrid

// Firebase como principal, LocalStorage como backup
// Sincronización automática entre ambos
```

### Múltiples Adaptadores

Fácil añadir nuevos adaptadores de persistencia:

```javascript
// Crear nuevo adaptador
class CustomAdapter extends BaseAdapter {
  // Implementar métodos requeridos
}

// Registrar en PersistenceAdapter
persistence.registerAdapter('custom', CustomAdapter);
```

## 🧪 Testing

### Configuración de Testing

```javascript
// En modo testing, usar LocalStorage
VITE_PERSISTENCE_TYPE=localStorage
VITE_TESTING_MODE=true

// Limpiar datos de testing
await persistence.clearAllData();
```

### Ejecutar Tests

```bash
# Si usas PEST (recomendado)
./vendor/bin/pest

# O con PHPUnit
./vendor/bin/phpunit
```

## 📚 Recursos Adicionales

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Rules](https://firebase.google.com/docs/storage/security)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisar esta documentación
2. Verificar configuración con `debugConfig()`
3. Revisar logs de consola del navegador
4. Crear issue en el repositorio

---

**¡Disfruta creando memories en tu juego PixelLife! 🎮✨**
