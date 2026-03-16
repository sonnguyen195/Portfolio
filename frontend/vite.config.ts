import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/three/') || id.includes('node_modules/@react-three/')) {
            return 'three'
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // WSL2: use the "Network" URL (e.g. http://172.29.x.x:5173/) from Windows browser if localhost fails
    allowedHosts: true
  },
})
