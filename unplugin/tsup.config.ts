import { defineConfig } from "tsup";

export default defineConfig({
	entryPoints: ["src/*.ts"],
	clean: true,
	format: ["cjs", "esm"],
	dts: true,
	cjsInterop: true,
	splitting: true,
	onSuccess: "npm run build:fix",
});
