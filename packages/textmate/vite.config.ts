import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	pack: {
		entry: ["src/index.ts"],
		copy: {
			from: "src/grammar.json",
			to: "dist",
		},
	},
}) satisfies UserConfig as UserConfig;
