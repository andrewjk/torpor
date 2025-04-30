import { type Options, defineConfig } from "tsup";

type Config =
	| Options
	| Options[]
	| ((overrideOptions: Options) => Options | Options[] | Promise<Options | Options[]>);

export default defineConfig({
	entry: ["src/*.ts"],
	format: ["esm", "cjs"],
	dts: true,
	cjsInterop: true,
	clean: true,
	splitting: true,
	onSuccess: "npm run build:fix",
}) satisfies Config as Config;
