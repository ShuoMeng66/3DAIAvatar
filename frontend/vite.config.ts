import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    // AutoDL 个人用户通过 *.seetacloud.com 公网访问 6006
    allowedHosts: ['.seetacloud.com', 'localhost', '127.0.0.1'],
  },
})