import { addVitePlugin, addWebpackPlugin, defineNuxtModule } from "@nuxt/kit";
import "@nuxt/schema";
import type { NuxtModule, VitePlugin } from "@nuxt/schema";
import type Options from "./types";
import vite from "./vite";
import webpack from "./webpack";

export interface ModuleOptions extends Options {}

const plugin: NuxtModule<ModuleOptions, ModuleOptions, false> = defineNuxtModule<ModuleOptions>({
	meta: {
		name: "nuxt-unplugin-torpor",
		configKey: "unpluginStarter",
	},
	defaults: {
		// ...default options
	},
	setup(options, _nuxt) {
		// Cast past Vite 8's deeply-recursive plugin types, which otherwise blow
		// the comparison depth against @nuxt/schema's own Vite plugin type
		addVitePlugin(() => vite(options) as VitePlugin | VitePlugin[]);
		addWebpackPlugin(() => webpack(options));

		// ...
	},
});

export default plugin;
