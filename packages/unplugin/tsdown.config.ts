import { type UserConfig, defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/*.ts"],
}) satisfies UserConfig as UserConfig;
