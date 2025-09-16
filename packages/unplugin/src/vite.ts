import { createVitePlugin } from "unplugin";
import type { Plugin } from "vite";
import { unpluginFactory } from ".";
import type { Options } from "./types";

const plugin: (options?: Options) => Plugin<any> | Plugin<any>[] =
	createVitePlugin(unpluginFactory);

export default plugin;
