import { type UserConfigFnObject, defineConfig } from "vitest/config";
import torpor from "./packages/unplugin/dist/vite";

export default defineConfig(({ mode }) => ({
	plugins: [torpor()],
	resolve: {
		conditions: mode === "test" ? ["browser"] : [],
	},
	test: {
		environment: "jsdom",
		setupFiles: "./vitest.setup.ts",
	},
})) satisfies UserConfigFnObject as UserConfigFnObject;
