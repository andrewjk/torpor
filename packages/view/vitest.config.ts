import { type UserConfigFnObject, defineConfig } from "vitest/config";
import torpor from "../unplugin/dist/vite";

export default defineConfig(({ mode }) => ({
	plugins: [torpor()],
	resolve: {
		conditions: mode === "test" ? ["browser"] : [],
	},
	test: {
		environment: "jsdom",
		globalSetup: "./test/globalSetup.ts",
	},
})) satisfies UserConfigFnObject as UserConfigFnObject;
