import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // Prevent Vite from pre-bundling MediaPipe packages.
  // They ship their own WASM loader that does not survive Vite's bundler.
  optimizeDeps: {
    exclude: [
      '@mediapipe/face_mesh',
      '@mediapipe/camera_utils',
      '@mediapipe/drawing_utils',
    ],
  },
})
