import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/*.ts"],
	format: ["esm", "cjs"],
	dts: true,
	cjsInterop: true,
	clean: true,
	splitting: true,
	onSuccess: "npm run build:fix",
});
