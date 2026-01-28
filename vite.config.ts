
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Aumenta o limite de aviso para 1600kb (para não poluir o log)
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Separa as bibliotecas pesadas em arquivos separados (Code Splitting)
        // Isso faz o site carregar mais rápido e remove o aviso
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['date-fns', 'xlsx'],
          charts: ['recharts'],
          ui: ['lucide-react'],
          db: ['@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    port: 3000
  }
});
