import { defineConfig } from "vitest/config";
import tera from "./unplugin/dist/vite";

export default defineConfig(({ mode }) => ({
	plugins: [tera()],
	resolve: {
		conditions: mode === "test" ? ["browser"] : [],
	},
	test: {
		environment: "jsdom",
		setupFiles: "./testSetup.ts",
	},
}));
