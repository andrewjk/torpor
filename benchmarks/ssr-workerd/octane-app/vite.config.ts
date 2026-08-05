import { defineConfig } from 'vite-plus';
import { octane } from '@octanejs/vite-plugin';

export default defineConfig({
	plugins: [octane()],
	// `octane` ships raw TS, so Vite must transform it for the server bundle.
	ssr: { noExternal: [/^octane($|\/)/] },
});
