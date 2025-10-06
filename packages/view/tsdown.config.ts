import { type Options, defineConfig } from "tsdown";

type Config =
	| Options
	| Options[]
	| ((overrideOptions: Options) => Options | Options[] | Promise<Options | Options[]>);

export default defineConfig({
	entry: ["src/index.ts", "src/compile.ts", "src/ssr.ts"],
	format: ["esm", "cjs"],
	dts: true,
	sourcemap: true,
}) satisfies Config as Config;
