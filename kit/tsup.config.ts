import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/state.ts", "src/response.ts", "src/bin/index.ts"],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	metafile: true,
	sourcemap: true,
});
