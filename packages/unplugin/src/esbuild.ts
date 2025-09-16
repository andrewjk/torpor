import type { Plugin } from "esbuild";
import { createEsbuildPlugin } from "unplugin";
import { unpluginFactory } from ".";
import type { Options } from "./types";

const plugin: (options?: Options) => Plugin = createEsbuildPlugin(unpluginFactory);

export default plugin;
