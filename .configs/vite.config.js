import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Récupérer le chemin du fichier actuel (.configs/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],

  // Root pointe vers app-client depuis .configs/
  root: resolve(__dirname, '../app-client'),

  resolve: {
    alias: {
      '@': resolve(__dirname, '../app-client'),
      '@config': resolve(__dirname, '../app-client/config'),
      '@features': resolve(__dirname, '../app-client/features'),
      '@theme': resolve(__dirname, '../app-client/theme')
    }
  },

  server: {
    port: 3001,
    open: true,
    host: true
  },

  build: {
    outDir: resolve(__dirname, '../app-client/dist'),
    emptyOutDir: true
  }
});
