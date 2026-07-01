import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 3002,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // lucide 개별 아이콘(1892개) 을 단일 청크로 병합 → 요청 폭주 차단
          if (id.includes('lucide-react/dist/esm/icons/')) return 'lucide-icons'
        },
      },
    },
  }
})
