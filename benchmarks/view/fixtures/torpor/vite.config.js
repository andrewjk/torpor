import { defineConfig, lazyPlugins } from 'vite-plus';
import torpor from '@torpor/unplugin/vite';

// Production-mode dev server: deps resolve with the `production` condition so
// the framework runtimes are measured without dev-mode guards.
export default defineConfig({
	plugins: lazyPlugins(() => [torpor()]),
	mode: 'production',
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5483, strictPort: true },
	root: new URL('.', import.meta.url).pathname,
});
