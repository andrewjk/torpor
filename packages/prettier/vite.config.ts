import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	pack: {
		entry: ["src/index.ts"],
	},
}) satisfies UserConfig as UserConfig;
