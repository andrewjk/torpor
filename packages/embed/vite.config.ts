import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	pack: [
		{
			entry: ["src/index.ts", "src/compile.ts", "src/server.ts", "src/restricted.ts"],
			format: ["esm", "cjs"],
		},
		{
			// Worker entry for renderEmbed({ isolate: true }). Not exported
			// from package.json; renderInWorker resolves it next to dist.
			entry: ["src/worker/renderWorker.ts"],
			format: "esm",
			dts: false,
		},
	],
	lint: {
		options: {
			typeAware: true,
			typeCheck: true,
		},
		jsPlugins: [
			{
				name: "vite-plus",
				specifier: "vite-plus/oxlint-plugin",
			},
		],
		rules: {
			"vite-plus/prefer-vite-plus-imports": "error",
		},
	},
}) satisfies UserConfig as UserConfig;
