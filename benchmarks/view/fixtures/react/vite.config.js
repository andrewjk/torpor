import { defineConfig, lazyPlugins } from 'vite-plus';
import react from '@vitejs/plugin-react';

// Production React build (NODE_ENV=production resolves React's prod bundle).
export default defineConfig({
	plugins: lazyPlugins(() => [react()]),
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5475, strictPort: true },
	root: new URL('.', import.meta.url).pathname,
});
