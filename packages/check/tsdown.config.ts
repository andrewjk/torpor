import { type UserConfig, defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/bin/index.ts"],
	external: ["typescript"],
	onSuccess: "npm run build:fix",
}) satisfies UserConfig as UserConfig;
