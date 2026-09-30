import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	pack: {
		entry: {
			index: "src/index.ts",
			runtime: "src/runtime.ts",
		},
		// The Electron main/preload scripts are shipped verbatim and copied into
		// the site's dist/electron output by the adapter's postbuild hook
		copy: [
			{ from: "src/main.mjs", to: "dist" },
			{ from: "src/dev-main.mjs", to: "dist" },
			{ from: "src/preload.cjs", to: "dist" },
		],
	},
}) satisfies UserConfig as UserConfig;
