import path from 'path'
import { defineConfig } from 'vitest/config'

// vite.config.ts 를 그대로 쓰지 않는다 — 테스트엔 tailwind/react 플러그인이 필요 없고,
// 빌드 설정을 테스트 사정으로 흔들지 않으려는 것도 있다. alias 만 맞추면 된다.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
