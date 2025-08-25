import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],

  // Root vers app-client
  root: resolve(__dirname, '../app-client'),

  // Point d'entrée HTML
  build: {
    rollupOptions: {
      input: resolve(__dirname, '../app-client/cores/index.html')
    },
    outDir: resolve(__dirname, '../app-client/dist'),
    emptyOutDir: true
  },

  // Aliases de chemin
  resolve: {
    alias: {
      '@': resolve(__dirname, '../app-client'),
      '@components': resolve(__dirname, '../app-client/components'),
      '@config': resolve(__dirname, '../app-client/configs'),
      '@pages': resolve(__dirname, '../app-client/pages'),
      '@hooks': resolve(__dirname, '../app-client/hooks'),
      '@themes': resolve(__dirname, '../app-client/themes'),
      '@theme': resolve(__dirname, '../app-client/themes'),
      '@cores': resolve(__dirname, '../app-client/cores'),
      '@modules': resolve(__dirname, '../app-client/modules')
    }
  },

  // Serveur de dev
  server: {
    port: 3001,
    host: true,
    open: '/cores/' // Tenter d'ouvrir directement cores
  },

  // Support CSS/SCSS
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@theme/variables.scss" as *;'
      }
    }
  }
});
