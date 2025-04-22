import { type UserConfigFnObject, defineConfig } from "vitest/config";
import torpor from "../unplugin/dist/vite";

const config: UserConfigFnObject = defineConfig(({ mode }) => ({
	plugins: [torpor()],
	resolve: {
		conditions: mode === "test" ? ["browser"] : [],
	},
	test: {
		environment: "jsdom",
		globalSetup: "./test/globalSetup.ts",
	},
}));

export default config;
