import tera from "@tera/unplugin/vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
	plugins: [tera()],
	resolve: {
		conditions: mode === "test" ? ["browser"] : [],
	},
	test: {
		environment: "jsdom",
	},
}));
