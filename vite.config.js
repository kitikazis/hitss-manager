import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Rutas relativas: el build sirve igual desde /, desde una subcarpeta o inline.
  base: './',
  plugins: [react()],
  server: {
    host: true, // expone el server en la red local para el resto de operadores
    port: 5173,
    open: false,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    target: 'es2019',
    assetsDir: '.',
    rollupOptions: {
      output: {
        // Un solo bundle clasico: permite empaquetar todo en un unico .html.
        format: 'iife',
        // Con hash en el nombre, un despliegue nuevo nunca queda tapado por la cache.
        entryFileNames: 'app-[hash].js',
        assetFileNames: 'app-[hash].[ext]',
      },
    },
  },
});
