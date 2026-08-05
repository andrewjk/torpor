import { defineConfig, lazyPlugins } from 'vite-plus';
import preact from '@preact/preset-vite';

export default defineConfig({
	plugins: lazyPlugins(() => [preact()]),
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: { compress: { passes: 2, toplevel: true }, mangle: { toplevel: true } },
	},
	server: { port: 5260, strictPort: true },
});
