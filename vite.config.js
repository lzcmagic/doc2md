import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src')
    },
  },
  server: {
    host: true, // 监听所有地址，包括局域网和公网地址
    port: 5174,
    proxy: {
      // 将所有 /api 请求代理到我们的 Express 服务器
      '/api': {
        target: 'http://0.0.0.0:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}); 