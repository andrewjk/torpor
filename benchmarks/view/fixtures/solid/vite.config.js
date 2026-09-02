import { defineConfig, lazyPlugins } from 'vite-plus';
import solid from 'vite-plugin-solid';

// Production Solid build (solid's production condition via NODE_ENV define).
export default defineConfig({
	plugins: lazyPlugins(() => [solid()]),
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5479, strictPort: true },
	root: new URL('.', import.meta.url).pathname,
});
