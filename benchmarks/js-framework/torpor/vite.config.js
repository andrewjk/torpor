import torpor from '@torpor/unplugin/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [torpor()],
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: {
		target: 'esnext',
		minify: false,
	},
	server: { port: 5283, strictPort: true },
});
