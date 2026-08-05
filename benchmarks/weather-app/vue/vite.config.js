import { defineConfig } from 'vite-plus';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	plugins: [vue()],
	publicDir: '../shared/public',
	build: { target: 'esnext' },
	server: { port: 5297, strictPort: true },
});
