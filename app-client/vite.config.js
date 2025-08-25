import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Récupérer le chemin du fichier actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],

  // Root pointe vers app-client
  root: '.',

  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@components': resolve(__dirname, 'components'),
      '@config': resolve(__dirname, 'configs'),
      '@pages': resolve(__dirname, 'pages'),
      '@hooks': resolve(__dirname, 'hooks'),
      '@themes': resolve(__dirname, 'themes'),
      '@theme': resolve(__dirname, 'themes'),
      '@modules': resolve(__dirname, 'pages') // ALIAS AJOUTÉ pour @modules/ProjectTree etc
    }
  },

  server: {
    port: 3001,
    open: true,
    host: true
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
