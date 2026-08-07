import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	pack: {
		entry: ["src/index.ts", "src/compile.ts", "src/ssr.ts", "src/dev.ts"],
		format: ["esm", "cjs"],
	},
	lint: {
		// TODO: Why doesn't this work? Why do we need .oxlintrc.json?
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
	fmt: {
		// TODO: Why doesn't this work?
		ignorePatterns: ["test/**/output"],
	},
}) satisfies UserConfig as UserConfig;
