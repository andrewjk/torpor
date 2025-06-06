import { type RspackPluginInstance, createRspackPlugin } from "unplugin";
import { unpluginFactory } from ".";
import type { Options } from "./types";

const plugin: (options?: Options | undefined) => RspackPluginInstance =
	createRspackPlugin(unpluginFactory);

export default plugin;
