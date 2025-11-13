import { type UserConfig, defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/compile.ts", "src/ssr.ts", "src/dev.ts"],
	format: ["esm", "cjs"],
}) satisfies UserConfig as UserConfig;
