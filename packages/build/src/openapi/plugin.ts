import type SitePlugin from "../types/SitePlugin";
import openApiDocsHtml from "./docsHtml";
import type { OpenApiPluginOptions, ResolvedOpenApiOptions } from "./types";

/**
 * The `site.pluginState` key the openApi plugin stores its resolved options
 * under. A registry symbol (`Symbol.for`), so that the user's config, the
 * manifest plugin and the generated runtime code all resolve to the same
 * key even when they are loaded as separate module instances.
 */
export const OPEN_API_STATE_KEY: symbol = Symbol.for("@torpor/build/openapi");

/**
 * Serves an OpenAPI 3.1 document for the site's `+server` endpoints, plus an
 * optional interactive docs page.
 *
 * ```ts
 * import { Site } from "@torpor/build";
 * import { openApi } from "@torpor/build/openapi";
 * import { z } from "zod";
 *
 * const site = new Site();
 * site.addRouteFolder("src/routes");
 * site.plugins = [
 * 	openApi({
 * 		title: "My API",
 * 		toJsonSchema: (s) => z.toJSONSchema(s as z.ZodType, { io: "input" }),
 * 	}),
 * ];
 * export default site;
 * ```
 *
 * The document is served at `/openapi.json` (configurable with `path`) and
 * the docs page at `/docs` (set `docs: false` to disable). Endpoints are
 * picked up from every `+server.ts` route: its `params` schema becomes path
 * parameters, `get`/`head` schemas become query parameters, and
 * `post`/`patch`/`put`/`del`/`options` schemas become request bodies.
 *
 * The resolved options are stored in `site.pluginState` under
 * `OPEN_API_STATE_KEY`, which the manifest plugin reads at build time to
 * generate the document endpoint.
 */
export function openApi(options: OpenApiPluginOptions = {}): SitePlugin {
	return (site) => {
		const docPath = withLeadingSlash(options.path ?? "/openapi.json");
		if (site.routes.some((route) => route.path === docPath)) {
			throw new Error(
				`There is already a route registered at ${docPath}, so the OpenAPI document can't be ` +
					`served there. Pass a different "path" to the openApi() plugin`,
			);
		}

		const resolved: ResolvedOpenApiOptions = {
			path: docPath,
			docs: options.docs === false ? undefined : withLeadingSlash(options.docs ?? "/docs"),
			title: options.title ?? "API",
			version: options.version ?? "1.0.0",
			toJsonSchema: options.toJsonSchema,
		};
		site.pluginState.set(OPEN_API_STATE_KEY, resolved);

		if (resolved.docs) {
			const html = openApiDocsHtml(docPath);
			site.addRoute(resolved.docs, {
				server: {
					get: () =>
						new Response(html, {
							headers: { "Content-Type": "text/html; charset=utf-8" },
						}),
				},
			});
		}
	};
}

function withLeadingSlash(pathName: string): string {
	return pathName.startsWith("/") ? pathName : "/" + pathName;
}
