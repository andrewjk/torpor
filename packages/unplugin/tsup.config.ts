import { type Options, defineConfig } from "tsup";

type Config =
	| Options
	| Options[]
	| ((overrideOptions: Options) => Options | Options[] | Promise<Options | Options[]>);

export default defineConfig({
	entry: ["src/*.ts"],
	format: "esm",
	dts: true,
	clean: true,
	splitting: true,
}) satisfies Config as Config;
