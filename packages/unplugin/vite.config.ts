import { defineConfig, UserConfig } from "vite-plus";
import torpor from "./src/vite";

export default defineConfig({
	pack: {
		entry: ["src/*.ts"],
	},
	plugins: [torpor({ test: true })],
	test: {
		environment: "jsdom",
	},
}) satisfies UserConfig as UserConfig;
