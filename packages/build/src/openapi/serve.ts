import type ServerLoadEvent from "../types/ServerLoadEvent";
import buildOpenApiDocument from "./document";
import type { OpenApiLoader, OpenApiPluginOptions, OpenApiRouteEntry } from "./types";

/**
 * Creates the request handler for the OpenAPI document endpoint (the route the
 * manifest plugin generates). The base document is built from the route
 * loaders once, on the first request; each request then gets a copy with the
 * plugin's `extend` hook applied, if it has one.
 *
 * The options come from a getter rather than being captured here: the
 * generated module runs in the site, and reads them from `site.pluginState`
 * at runtime, so functions like `toJsonSchema` and `extend` are the site's
 * real functions instead of being serialized into the generated module.
 *
 * @param loaders Route path (with `[param]` segments) -> endpoint loader
 * @param getOptions Reads the plugin's resolved options
 */
export function createOpenApiHandler(
	loaders: Record<string, OpenApiLoader>,
	getOptions: () => OpenApiPluginOptions,
): (event: ServerLoadEvent) => Promise<Response> {
	let base: Record<string, unknown> | undefined;
	return async (event) => {
		const options = getOptions();
		if (!base) {
			const entries: OpenApiRouteEntry[] = [];
			for (const [routePath, load] of Object.entries(loaders)) {
				entries.push({ path: routePath, endPoint: (await load()).default });
			}
			base = buildOpenApiDocument(entries, options);
		}
		// A fresh copy per request, so a hook can mutate it (merging in this
		// request's paths, say) without affecting the cached document or a
		// concurrent request
		const doc = options.extend ? await options.extend(structuredClone(base), event) : base;
		return new Response(JSON.stringify(doc), {
			headers: { "Content-Type": "application/json" },
		});
	};
}
