import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' 让打包后的文件使用相对路径，部署到 GitHub Pages 子目录也能正常加载
export default defineConfig({
  plugins: [react()],
  base: './',
});
