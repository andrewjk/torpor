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
	},
})) satisfies ViteUserConfigFnObject as ViteUserConfigFnObject;
