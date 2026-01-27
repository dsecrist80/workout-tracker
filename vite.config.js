import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // IMPORTANT: Set this to your GitHub repo name
  // Format: base: '/repo-name/'
  // If your repo is 'workout-tracker', use: base: '/workout-tracker/'
  base: '/workout-tracker/',
  
  server: {
    host: true, // Expose to local network (access from phone)
    port: 5173,
    open: true // Auto-open browser on dev server start
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false, // Set to true for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/firestore']
        }
      }
    }
  }
});