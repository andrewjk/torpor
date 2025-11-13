import { type ViteUserConfigFnObject, defineConfig } from "vitest/config";
import torpor from "./packages/unplugin/dist/vite.mjs";

export default defineConfig(({ mode }) => ({
	plugins: [torpor()],
	resolve: {
		conditions: mode === "test" ? ["browser"] : [],
	},
	test: {
		environment: "jsdom",
		setupFiles: "./vitest.setup.ts",
	},
})) satisfies ViteUserConfigFnObject as ViteUserConfigFnObject;
