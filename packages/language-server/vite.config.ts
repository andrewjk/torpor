import { defineConfig, UserConfig } from "vite-plus";

// All runtime dependencies are kept external, so that they are resolved from
// node_modules at run time (TypeScript in particular needs to read its own
// lib .d.ts files from disk)
export default defineConfig({
	pack: {
		entry: ["src/index.ts", "src/bin/index.ts"],
		external: [
			"@torpor/view",
			"@typescript/vfs",
			"typescript",
			"vscode-css-languageservice",
			"vscode-html-languageservice",
			"vscode-languageserver",
			"vscode-languageserver-textdocument",
		],
		onSuccess: "npm run build:fix",
	},
}) satisfies UserConfig as UserConfig;
