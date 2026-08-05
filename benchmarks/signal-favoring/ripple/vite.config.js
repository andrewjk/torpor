import { defineConfig } from 'vite-plus';
import { ripple } from '@ripple-ts/vite-plugin';

export default defineConfig({
	plugins: [ripple({ excludeRippleExternalModules: true })],
	optimizeDeps: { exclude: ['ripple'] },
	build: { target: 'esnext', minify: false },
	server: { port: 5193, strictPort: true },
});
