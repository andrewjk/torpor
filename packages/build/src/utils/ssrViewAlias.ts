import type { Plugin } from "vite";

/**
 * Resolves `@torpor/view` to its server runtime (`@torpor/view/ssr`) in the
 * SSR environment only, leaving the client environment on the main entry.
 *
 * Server-compiled `.torp` files already import `@torpor/view/ssr` directly,
 * but shared `.ts`/`.js` modules (e.g. the compiled helpers in `@torpor/ui`)
 * import the main entry, so during SSR they get the client primitives --
 * `$cache` (with its `$cache must be used in a getter` guard), a proxying
 * `$watch`, an effect-running `$run`, etc. Aliasing them to the server entry
 * gives them `$serverCache`/`$serverWatch`/`$serverRun` and the rest, matching
 * what `.torp` server code already uses.
 *
 * The `@torpor/view/ssr` and `@torpor/view/dev` subpaths are left alone.
 */
export default function ssrViewAlias(): Plugin {
	return {
		name: "torpor:ssr-view",
		enforce: "pre",
		resolveId(source, importer, options) {
			if (source !== "@torpor/view") return;
			if (this.environment?.name !== "ssr") return;
			return this.resolve("@torpor/view/ssr", importer, { skipSelf: true, ...options });
		},
	};
}
