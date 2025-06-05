// C:\Users\tkyka\Downloads\test_simple_ScrollLayer\vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // pathモジュールをインポート

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // srcディレクトリを @ としてエイリアス
    },
  },
  optimizeDeps: { // 既存の optimizeDeps はそのまま残します
    exclude: ['lucide-react'],
  },
});