import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/response.ts", "src/run.ts", "src/state.ts", "src/bin/index.ts"],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	metafile: true,
	sourcemap: true,
	// Put this in here to stop issues with bundling Vite from bin/index.ts
	// I'm not sure if this will cause further issues down the line?
	external: ["vite"],
});
