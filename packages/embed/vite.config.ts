import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	pack: [
		{
			entry: ["src/index.ts", "src/artifact.ts", "src/app.ts"],
			format: ["esm", "cjs"],
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
