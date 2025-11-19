import { type UserConfig, defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	copy: [
		"src/_worker.ts",
		{
			from: "src/_worker.ts",
			to: "dist/_worker.ts",
		},
	],
}) satisfies UserConfig as UserConfig;
