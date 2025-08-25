import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Récupérer le chemin de la racine du projet
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],

  // Root doit pointer vers app-client
  root: resolve(__dirname, 'app-client'),

  resolve: {
    alias: {
      '@': resolve(__dirname, 'app-client'),
      '@components': resolve(__dirname, 'app-client/components'),
      '@config': resolve(__dirname, 'app-client/configs'),
      '@pages': resolve(__dirname, 'app-client/pages'),
      '@hooks': resolve(__dirname, 'app-client/hooks'),
      '@themes': resolve(__dirname, 'app-client/themes'),
      '@theme': resolve(__dirname, 'app-client/themes'),
      '@cores': resolve(__dirname, 'app-client/cores')
    }
  },

  server: {
    port: 3001,
    open: true,
    host: true
  },

  build: {
    outDir: resolve(__dirname, 'app-client/dist'),
    emptyOutDir: true
  }
});
