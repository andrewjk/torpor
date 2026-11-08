import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	pack: [
		{
			entry: ["src/index.ts", "src/compile.ts", "src/ssr.ts", "src/dev.ts"],
			format: ["esm", "cjs"],
		},
		{
			// A single-file, browser-ready build of the runtime, for REPLs and
			// embeds: everything is inlined into one script with no imports, and
			// all exports are attached to the `TorporView` global.
			entry: ["src/runtime.ts"],
			format: "iife",
			globalName: "TorporView",
			platform: "browser",
			minify: true,
			dts: false,
			sourcemap: false,
		},
	],
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
		// NOTE: a package-level fmt block REPLACES the root fmt config
		// (vite-plus doesn't merge partial blocks), so this must spell out the
		// full settings — a partial block here would make `vp fmt .` inside
		// this package format with tool defaults (2-space, no import order).
		// Ignore patterns are relative to this package.
		useTabs: true,
		printWidth: 100,
		trailingComma: "all",
		importOrder: ["^[../]", "^[./]"],
		importOrderSortSpecifiers: true,
		sortPackageJson: false,
		ignorePatterns: [
			"test/**/*-client.ts",
			"test/**/*-server.ts",
			"test/**/*-types.ts",
			"test/**/output",
		],
	},
}) satisfies UserConfig as UserConfig;
