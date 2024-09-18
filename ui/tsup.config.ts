import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/Accordion.ts", "src/motion.ts"],
	//dts: true,
	dts: {
		entry: ["src/motion.ts"],
	},
	format: ["esm", "cjs"],
	splitting: false,
	sourcemap: true,
	clean: true,
	metafile: true,
	loader: {
		".tera": "file",
	},
	onSuccess: "npm run build:fix",
});
