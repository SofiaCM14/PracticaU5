import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Esto es necesario para que Amplify funcione con Vite
    global: {},
  },
})
