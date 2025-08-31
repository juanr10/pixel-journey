# Configuración de Firebase para PixelLife

## 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear proyecto"
3. Nombre del proyecto: `pixelLife` (o el que prefieras)
4. Desactiva Google Analytics si no lo necesitas
5. Haz clic en "Crear proyecto"

## 2. Habilitar Firestore Database

1. En el menú lateral, haz clic en "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de prueba" (para desarrollo)
4. Selecciona la ubicación más cercana a ti
5. Haz clic en "Habilitar"

## 3. Habilitar Storage

1. En el menú lateral, haz clic en "Storage"
2. Haz clic en "Comenzar"
3. Selecciona "Comenzar en modo de prueba"
4. Selecciona la misma ubicación que Firestore
5. Haz clic en "Hecho"

## 4. Configurar reglas de seguridad

### Firestore Rules
Ve a Firestore Database > Reglas y reemplaza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura para todos (modo desarrollo)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Storage Rules
Ve a Storage > Reglas y reemplaza con:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura/escritura para todos (modo desarrollo)
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## 5. Obtener configuración de la app

1. En la página principal del proyecto, haz clic en el ícono de web (</>)
2. Nombre de la app: `PixelLife Web`
3. Marca "También configurar Firebase Hosting" si quieres
4. Haz clic en "Registrar app"
5. Copia la configuración que aparece

## 6. Actualizar archivo de configuración

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

## 7. Estructura de datos

### Colección: memories
```javascript
{
  id: "auto-generado",
  userId: "default_user",
  type: "camera|game|house|juan|love|mountain|museo|paula|travel",
  position: { x: 0, y: 0 },
  title: "Título del memory",
  description: "Descripción opcional",
  images: [
    {
      id: "img_123",
      url: "https://...",
      filename: "foto.jpg",
      uploadedAt: "2024-01-15T10:30:00Z",
      metadata: { size: 1024000, type: "image/jpeg" }
    }
  ],
  metadata: {},
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Colección: paths
```javascript
{
  id: "auto-generado",
  memoryId: "referencia-al-memory",
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

## 8. Límites del plan gratuito

- **Firestore**: 1GB de almacenamiento, 50K lecturas/día, 20K escrituras/día
- **Storage**: 5GB de almacenamiento, 1GB de transferencia/día
- **Hosting**: 10GB de almacenamiento, 360MB de transferencia/día

## 9. Próximos pasos

1. Configurar autenticación de usuarios (opcional)
2. Implementar reglas de seguridad más estrictas
3. Configurar backup automático
4. Implementar monitoreo y alertas

## 10. Solución de problemas

### Error: "Firebase App named '[DEFAULT]' already exists"
- Asegúrate de que solo inicializas Firebase una vez
- Verifica que no hay múltiples imports del mismo archivo

### Error: "Permission denied"
- Verifica las reglas de Firestore y Storage
- Asegúrate de que están en modo de prueba

### Error: "Quota exceeded"
- Verifica el uso en Firebase Console
- Considera actualizar al plan de pago si es necesario

## 11. Comandos útiles

```bash
# Instalar Firebase CLI (opcional)
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Inicializar proyecto
firebase init

# Desplegar
firebase deploy
```

## 12. Enlaces útiles

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Console](https://console.firebase.google.com/)
