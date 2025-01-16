import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/Accordion/index.ts", "src/motion.ts"],
	format: ["esm", "cjs"],
	dts: { entry: ["src/motion.ts"] },
	clean: true,
	metafile: true,
	sourcemap: true,
	loader: {
		".torp": "file",
	},
	onSuccess: "npm run build:fix",
});
