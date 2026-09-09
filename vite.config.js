import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build', // Mantener 'build' en lugar de 'dist' (por defecto de Vite) para que sea igual que CRA
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) return 'vendor';
          }
        }
      }
    }
  },
  server: {
    port: 3000, // Puerto de desarrollo por defecto de CRA
    open: true,
  }
});
