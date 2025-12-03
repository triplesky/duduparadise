import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 监听所有地址，这样局域网设备才能连接
    host: '0.0.0.0', 
    // 默认端口 5173
    port: 5173,
  }
})
