import { type Options, defineConfig } from "tsdown";

type Config =
	| Options
	| Options[]
	| ((overrideOptions: Options) => Options | Options[] | Promise<Options | Options[]>);

export default defineConfig({
	entry: ["src/*.ts"],
	format: "esm",
	dts: true,
}) satisfies Config as Config;
