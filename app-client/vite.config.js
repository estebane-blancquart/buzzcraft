import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
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
      // FIX: @modules doit pointer vers les vrais emplacements
      '@modules/ProjectTree.jsx': resolve(__dirname, 'pages/editor/structure/ProjectTree.jsx'),
      '@modules/ProjectPreview.jsx': resolve(__dirname, 'pages/editor/preview/ProjectPreview.jsx'),
      '@modules/ProjectProperties.jsx': resolve(__dirname, 'pages/editor/properties/ProjectProperties.jsx')
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
