import { type Options, defineConfig } from "tsup";

type Config =
	| Options
	| Options[]
	| ((overrideOptions: Options) => Options | Options[] | Promise<Options | Options[]>);

export default defineConfig({
	entry: [
		"src/Accordion/index.ts",
		"src/Dialog/index.ts",
		"src/NavMenu/index.ts",
		"src/Offscreen/index.ts",
		"src/Popover/index.ts",
		"src/TabGroup/index.ts",
		"src/motion.ts",
	],
	format: ["esm", "cjs"],
	dts: { entry: ["src/motion.ts"] },
	clean: true,
	metafile: true,
	sourcemap: true,
	loader: {
		".torp": "file",
	},
	onSuccess: "npm run build:fix",
}) satisfies Config as Config;
