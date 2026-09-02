import { defineConfig, lazyPlugins } from 'vite-plus';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Production Svelte build.
export default defineConfig({
	plugins: lazyPlugins(() => [svelte()]),
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5491, strictPort: true },
	root: new URL('.', import.meta.url).pathname,
});
