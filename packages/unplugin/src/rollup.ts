import type { Plugin } from "rollup";
import { createRollupPlugin } from "unplugin";
import { unpluginFactory } from ".";
import type { Options } from "./types";

const plugin: (options?: Options | undefined) => Plugin<any> | Plugin<any>[] =
	createRollupPlugin(unpluginFactory);

export default plugin;
