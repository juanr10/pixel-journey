import { defineConfig } from "vite";

export default defineConfig({
  // Configuración del servidor de desarrollo
  server: {
    port: 5500,
    host: "127.0.0.1",
    open: true,
  },

  // Configuración de build
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },

  // Configuración de variables de entorno
  envPrefix: "VITE_",

  // Configuración de assets públicos
  publicDir: "public",
});
