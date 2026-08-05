
import { defineConfig, UserConfig } from "vite-plus";

export default defineConfig({
	pack: {
		entry: ["src/index.ts", "src/bin/index.ts"],
		external: ["typescript"],
		onSuccess: "npm run build:fix",
	},
}) satisfies UserConfig as UserConfig;
