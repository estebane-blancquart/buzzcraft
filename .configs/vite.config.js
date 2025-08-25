import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  // Root vers app-client (cohérent avec votre structure)
  root: resolve(__dirname, '../app-client'),
  // Point d'entrée HTML dans cores/
  build: {
    rollupOptions: {
      input: resolve(__dirname, '../app-client/cores/index.html')
    },
    outDir: resolve(__dirname, '../app-client/dist'),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../app-client'),
      '@config': resolve(__dirname, '../app-client/configs'),
      '@pages': resolve(__dirname, '../app-client/pages'),
      '@hooks': resolve(__dirname, '../app-client/hooks'),
      '@themes': resolve(__dirname, '../app-client/themes'),
      '@theme': resolve(__dirname, '../app-client/themes')
    }
  },
  server: {
    port: 3001,
    host: true
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

