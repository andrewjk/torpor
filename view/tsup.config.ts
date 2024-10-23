import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/compile.ts", "src/ssr.ts"],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	metafile: true,
	sourcemap: true,
});
