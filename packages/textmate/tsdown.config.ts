import { type UserConfig, defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	copy: {
		from: "src/grammar.json",
		to: "dist",
	},
}) satisfies UserConfig as UserConfig;
