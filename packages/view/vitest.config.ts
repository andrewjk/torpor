import { type ViteUserConfigFnObject, defineConfig } from "vite-plus";
import torpor from "../unplugin/dist/vite.mjs";

export default defineConfig(({ mode }) => ({
	plugins: [torpor()],
	resolve: {
		conditions: mode === "test" ? ["browser"] : [],
	},
	test: {
		environment: "jsdom",
		globalSetup: "./test/globalSetup.ts",
		// Reuse each worker's jsdom across files, but still give every file a
		// fresh window: some tests put state on `window` (e.g. __unmountLog),
		// so `isolate: false` leaks between files (vitest doctor).
		pool: "vmThreads",
	},
})) satisfies ViteUserConfigFnObject as ViteUserConfigFnObject;
