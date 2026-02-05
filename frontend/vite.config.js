import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-response-headers',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Content-Security-Policy', "frame-ancestors https://*.salesforce.com https://*.force.com https://*.lightning.force.com http://localhost:* 'self'");
          next();
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  },
  define: {
    // Fix for @react-pdf/renderer "Buffer is not defined" error
    'global': 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});