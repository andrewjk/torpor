import unplugin from ".";
import type Options from "./types";

export default (options: Options) => ({
	name: "unplugin-torpor",
	hooks: {
		"astro:config:setup": async (astro: any): Promise<void> => {
			astro.config.vite.plugins ||= [];
			astro.config.vite.plugins.push(unplugin.vite(options));
		},
	},
});
