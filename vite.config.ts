import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // Alias for the src folder
    }
  },
  esbuild: {
    // Suppress warnings about unused variables and parameters during build
    logOverride: { 'ts-unused-vars': 'silent' }
  },
  build: {
    // Add further custom build configurations if needed
    target: 'esnext', // Modern JS target
    minify: 'esbuild', // Minify using esbuild
  }
});
