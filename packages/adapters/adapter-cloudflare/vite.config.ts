import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	pack: {
		entry: ["src/index.ts"],
		copy: [
			"src/_worker.ts",
			{
				from: "src/_worker.ts",
				to: "dist",
			},
		],
	},
}) satisfies UserConfig as UserConfig;
