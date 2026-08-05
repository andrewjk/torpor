import { defineConfig, lazyPlugins } from 'vite-plus';
import { ripple } from '@ripple-ts/vite-plugin';

export default defineConfig({
	plugins: lazyPlugins(() => [ripple({ excludeRippleExternalModules: true })]),
	optimizeDeps: { exclude: ['ripple'] },
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: { compress: { passes: 2, toplevel: true }, mangle: { toplevel: true } },
	},
	server: { port: 5178, strictPort: true },
});
