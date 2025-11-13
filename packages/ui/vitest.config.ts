import torpor from "@torpor/unplugin/vite";
import { type ViteUserConfigFnObject, defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
	plugins: [torpor()],
	resolve: {
		conditions: mode === "test" ? ["browser"] : [],
	},
	test: {
		environment: "jsdom",
	},
})) satisfies ViteUserConfigFnObject as ViteUserConfigFnObject;
