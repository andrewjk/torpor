import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/bin/index.ts", "src/utils.ts"],
	dts: true,
	format: ["esm"],
	splitting: false,
	sourcemap: true,
	clean: true,
	metafile: true,
});
