import torpor from "@torpor/unplugin/vite";
import { type ViteUserConfigFnObject, defineConfig } from "vite-plus";

export default defineConfig(({ mode }) => ({
	plugins: [torpor({ test: true })],
	resolve: {
		conditions: mode === "test" ? ["browser"] : [],
		tsconfigPaths: true,
	},
	test: {
		environment: "happy-dom",
	},
})) satisfies ViteUserConfigFnObject as ViteUserConfigFnObject;
