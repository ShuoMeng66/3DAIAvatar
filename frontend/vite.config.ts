import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages 部署在 /3DAIAvatar/ 子路径下
  base: '/3DAIAvatar/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
