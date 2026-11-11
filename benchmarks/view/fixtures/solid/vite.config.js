import { defineConfig, lazyPlugins } from 'vite-plus';
import solid from 'vite-plugin-solid';

export default defineConfig({
	plugins: lazyPlugins(() => [
		// dev:false keeps the plugin from injecting the `development` export
		// condition, which resolves solid-js to dist/dev.js — the dev-mode
		// runtime (devComponent wrappers, assertions) — during `vp dev`.
		solid({ dev: false }),
	]),
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	build: { target: 'esnext', minify: false },
	server: { port: 5479, strictPort: true },
	root: new URL('.', import.meta.url).pathname,
});
