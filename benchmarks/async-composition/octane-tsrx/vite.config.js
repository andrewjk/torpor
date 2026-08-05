import { defineConfig } from 'vite-plus';
import { octane } from 'octane/compiler/vite';

export default defineConfig({
	plugins: [octane()],
	optimizeDeps: {
		exclude: ['octane', 'octane/compiler'],
	},
	build: { target: 'esnext' },
	server: { port: 5282, strictPort: true },
});
