import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	pack: {
		// Explicit names so the entry files have stable paths in dist (they're
		// referenced by file name from site builds and the adapters)
		entry: {
			index: "src/index.ts",
			form: "src/form.ts",
			nav: "src/nav.ts",
			openapi: "src/openapi.ts",
			response: "src/response.ts",
			run: "src/run.ts",
			schema: "src/schema.ts",
			server: "src/server.ts",
			state: "src/state.ts",
			test: "src/test.ts",
			dev: "src/dev.ts",
			// Subfolder key: a flat "Server" entry would collide with the
			// existing "server" entry on case-insensitive filesystems
			"server/Server": "src/server/Server.ts",
			clientEntry: "src/site/clientEntry.ts",
			clientEntryDev: "src/site/clientEntryDev.ts",
			serverEntry: "src/site/serverEntry.ts",
			"bin/index": "src/bin/index.ts",
		},
		// Put this in here to stop issues with bundling Vite from bin/index.ts
		// I'm not sure if this will cause further issues down the line?
		external: [
			"vite",
			// The manifest module doesn't exist at bundle time; it's a virtual
			// module provided by the manifest Vite plugin when sites run/build
			"@torpor/build/manifest",
		],
		outputOptions: {
			entryFileNames: (chunk) => (chunk.name === "bin/index" ? "bin/index.js" : "[name].mjs"),
		},
	},
}) satisfies UserConfig as UserConfig;
