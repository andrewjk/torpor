import { defineConfig } from "vitest/config";
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
}));
