import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	staged: {
		"*": "vp check --fix",
	},
	lint: {
		jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
		rules: { "vite-plus/prefer-vite-plus-imports": "error" },
		options: { typeAware: true, typeCheck: true },
	},
	fmt: {
		useTabs: true,
		printWidth: 100,
		trailingComma: "all",
		importOrder: ["^[../]", "^[./]"],
		importOrderSortSpecifiers: true,
		sortPackageJson: false,
		ignorePatterns: [
			"pnpm-lock.yaml",
			"packages/view/test/**/*-client.ts",
			"packages/view/test/**/*-server.ts",
			"packages/view/test/**/*-types.ts",
			"benchmarks/",
		],
	},
}) satisfies UserConfig as UserConfig;
