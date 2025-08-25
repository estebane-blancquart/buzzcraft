import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],

  // Root directement sur cores/ où est index.html
  root: resolve(__dirname, '../app-client/cores'),

  resolve: {
    alias: {
      '@': resolve(__dirname, '../app-client'),
      '@config': resolve(__dirname, '../app-client/configs'),
      '@pages': resolve(__dirname, '../app-client/pages'),
      '@hooks': resolve(__dirname, '../app-client/hooks'),
      '@themes': resolve(__dirname, '../app-client/themes')
    }
  },

  server: {
    port: 3001,
    host: true
  }
});
