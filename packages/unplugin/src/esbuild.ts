import type { Plugin } from "esbuild";
import { createEsbuildPlugin } from "unplugin";
import { unpluginFactory } from ".";
import type { Options } from "./types";

const plugin: (options?: Options | undefined) => Plugin = createEsbuildPlugin(unpluginFactory);

export default plugin;
