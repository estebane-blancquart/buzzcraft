import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@components': resolve(__dirname, 'components'),
      '@modules': resolve(__dirname, 'modules'),
      '@pages': resolve(__dirname, 'pages'),
      '@hooks': resolve(__dirname, 'hooks'),
      '@utils': resolve(__dirname, 'utils'),
      '@theme': resolve(__dirname, 'theme'),
      '@config': resolve(__dirname, 'config')
    }
  },
  server: {
    port: 3001,
    host: true
  }
});
