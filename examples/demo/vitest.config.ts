import torpor from "@torpor/unplugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { type ViteUserConfigFnObject, defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
	// TODO: Make tsconfigPaths not required
	plugins: [torpor({ test: true }), tsconfigPaths()],
	resolve: {
		conditions: mode === "test" ? ["browser"] : [],
	},
	test: {
		environment: "happy-dom",
	},
})) satisfies ViteUserConfigFnObject as ViteUserConfigFnObject;
