import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	pack: {
		entry: ["src/*.ts"],
	},
}) satisfies UserConfig as UserConfig;
