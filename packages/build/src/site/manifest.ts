import { readFileSync } from "node:fs";
import path from "node:path";
import { Plugin } from "vite";
import type { ResolvedOpenApiOptions } from "../openapi/types";
import { OPEN_API_STATE_KEY } from "../openapi/plugin";
import Site from "./Site";
import { SERVER_ROUTE } from "../types/RouteType";

const moduleId = "@torpor/build/manifest";

const LOAD_EXPORT_RE =
	/[{,]\s*load\s*[:(]|\bexport\s+(?:async\s+)?(?:function|const|let|var)\s+load\b|\bexport\s*\{[^}]*\bload\b/;

export function hasLoadExport(source: string): boolean {
	return LOAD_EXPORT_RE.test(source);
}

/**
 * A Vite plugin that provides information about the app to both clientEntry and
 * serverEntry.
 */
export default function manifest(site: Site, server = false): Plugin {
	return {
		name: "torpor-manifest",
		resolveId: {
			order: "pre",
			handler(id) {
				if (id === moduleId) {
					return id;
				}
			},
		},
		// @ts-ignore
		load(id, viteOptions) {
			if (id === moduleId) {
				let serverRequest = server && !!viteOptions?.ssr;

				// If there are inline endpoints, site plugins or an OpenAPI
				// document, and we're building for the server, we need to import
				// the config file to access them. On the client, the config file
				// is never imported, keeping server code out of the client bundle.
				const hasInline = site.routes.some((r) => r.endPoint && !r.file);
				const hasPlugins = site.plugins.length > 0;
				const hasOpenApi = site.pluginState.has(OPEN_API_STATE_KEY);
				const configImport =
					hasInline || hasPlugins || hasOpenApi
						? serverRequest && site.configFile
							? `import __site from ${JSON.stringify(site.configFile)};`
							: ""
						: "";

				// Site plugins are run when the server starts up (in dev and in
				// production), so that routes they register are available at
				// runtime. Top-level await is fine here: this module is only
				// loaded through Vite's SSR pipeline
				const pluginLoop =
					serverRequest && hasPlugins
						? `for (const __plugin of __site.plugins ?? []) { await __plugin(__site); }`
						: "";

				// The OpenAPI document endpoint is generated code (rather than an
				// inline endpoint) because it must load each route file -- which
				// only works from module code that Vite processes/bundles. The
				// options live in `site.pluginState` (set by the plugin), so they
				// are available both here and in the generated runtime code
				const openApiOptions = site.pluginState.get(OPEN_API_STATE_KEY) as
					| ResolvedOpenApiOptions
					| undefined;
				const openApiGlue =
					serverRequest && openApiOptions && site.configFile
						? openApiGlueCode(site, openApiOptions)
						: "";

				const openApiRoute =
					serverRequest && openApiOptions
						? `{ path: ${JSON.stringify(openApiOptions.path)}, type: ${SERVER_ROUTE}, endPoint: () => Promise.resolve({ default: { get: __openApiGet } }), subFolder: undefined },`
						: "";

				return `
${!serverRequest ? "const load = { default: { load: true } };" : ""}
${configImport}
${pluginLoop}
${openApiGlue}
export default {
  routes: [
    ${site.routes
			.map((r) => {
				let endPoint: string;
				if (!r.file) {
					// Inline endpoint (no file)
					if (serverRequest) {
						const key = `${r.path}:${r.type}`;
						endPoint = `() => Promise.resolve({ default: __site.inlineEndPoints[${JSON.stringify(key)}] })`;
					} else {
						// Client-side stub: check if the inline
						// endpoint has a load function
						const haveLoad =
							typeof (r.endPoint as Record<string, unknown> | undefined)?.load === "function";
						endPoint = haveLoad ? "() => load" : "undefined";
					}
				} else if (serverRequest || !/server\.(ts|js)$/.test(r.file)) {
					const filePath = path.join(site.root, r.file);
					const importExpr = `() => import(/* @vite-ignore */ "${filePath}")`;
					// A .torp file's default export is a component, so wrap it
					// as a PageEndPoint ({ component }) for the entries
					endPoint = r.file.endsWith(".torp")
						? `${importExpr}.then((m) => ({ default: { component: m.default } }))`
						: importExpr;
				} else {
					// On the client, for a server route, we need to check
					// whether there's a load function and set a dummy endPoint
					// if so. The correct endpoint will be hit in clientEntry
					const haveLoad = hasLoadExport(readFileSync(path.join(site.root, r.file), "utf8"));
					endPoint = haveLoad ? "() => load" : "undefined";
				}
				const sub = r.subFolder ? `"${r.subFolder}"` : "undefined";
				return `{ path: "${r.path}", type: ${r.type}, endPoint: ${endPoint}, subFolder: ${sub} },`;
			})
			.join("\n    ")}
    ${openApiRoute}
  ],
};
`;
			}
		},
	};
}

/**
 * Generates the module code for the OpenAPI document endpoint: a map of
 * route path to endpoint loader, and a cached handler that loads every
 * endpoint and builds the document on first use.
 */
function openApiGlueCode(site: Site, options: ResolvedOpenApiOptions): string {
	const loaders = site.routes
		.filter((r) => r.type === SERVER_ROUTE)
		// Don't document the docs page itself
		.filter((r) => r.path !== options.docs)
		.map((r) => {
			if (!r.file) {
				const key = `${r.path}:${r.type}`;
				return `${JSON.stringify(r.path)}: () => Promise.resolve({ default: __site.inlineEndPoints[${JSON.stringify(key)}] })`;
			}
			const filePath = path.join(site.root, r.file);
			return `${JSON.stringify(r.path)}: () => import(/* @vite-ignore */ ${JSON.stringify(filePath)})`;
		})
		.join(",\n    ");

	return `
import { buildOpenApiDocument, OPEN_API_STATE_KEY } from "@torpor/build/openapi";
let __openApiDoc;
const __openApiRoutes = {
    ${loaders}
};
async function __openApiGet() {
    if (!__openApiDoc) {
        const __entries = [];
        for (const [__path, __loader] of Object.entries(__openApiRoutes)) {
            __entries.push({ path: __path, endPoint: (await __loader()).default });
        }
        __openApiDoc = buildOpenApiDocument(__entries, __site.pluginState.get(OPEN_API_STATE_KEY));
    }
    return new Response(JSON.stringify(__openApiDoc), {
        headers: { "Content-Type": "application/json" },
    });
}
`;
}
