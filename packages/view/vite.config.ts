import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	pack: {
		entry: ["src/index.ts", "src/compile.ts", "src/ssr.ts", "src/dev.ts"],
		format: ["esm", "cjs"],
	},
	lint: {
		ignorePatterns: ["test/**/output"],
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
