import { type WebpackPluginInstance, createWebpackPlugin } from "unplugin";
import { unpluginFactory } from ".";
import type { Options } from "./types";

const plugin: (options?: Options | undefined) => WebpackPluginInstance =
	createWebpackPlugin(unpluginFactory);

export default plugin;
