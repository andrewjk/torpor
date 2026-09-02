import { defineConfig, lazyPlugins } from 'vite-plus';
import vue from '@vitejs/plugin-vue';

// Production Vue build (NODE_ENV define compiles out the dev guards).
export default defineConfig({
	plugins: lazyPlugins(() => [vue()]),
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5480, strictPort: true },
	root: new URL('.', import.meta.url).pathname,
});
