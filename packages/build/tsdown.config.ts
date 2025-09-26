import { type Options, defineConfig } from "tsdown";

type Config =
	| Options
	| Options[]
	| ((overrideOptions: Options) => Options | Options[] | Promise<Options | Options[]>);

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/nav.ts",
		"src/response.ts",
		"src/run.ts",
		"src/server.ts",
		"src/state.ts",
		"src/test.ts",
		"src/bin/index.ts",
	],
	format: "esm",
	dts: true,
	sourcemap: true,
	// Put this in here to stop issues with bundling Vite from bin/index.ts
	// I'm not sure if this will cause further issues down the line?
	external: ["vite"],
}) satisfies Config as Config;
