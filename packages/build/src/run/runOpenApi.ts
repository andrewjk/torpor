import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { ViteDevServer } from "vite";
import buildOpenApiDocument from "../openapi/document";
import { OPEN_API_STATE_KEY } from "../openapi/plugin";
import type { OpenApiEndPoint, OpenApiRouteEntry, ResolvedOpenApiOptions } from "../openapi/types";
import type Site from "../site/Site";
import { SERVER_ROUTE } from "../types/RouteType";

/**
 * Writes an OpenAPI document for the site's +server endpoints to a file.
 * Route files are loaded through the supplied Vite server, so this must be
 * called while the server from `loadSite` is still open.
 */
export default async function runOpenApi(
	site: Site,
	vite: ViteDevServer,
	outFile = "openapi.json",
): Promise<void> {
	const options = site.pluginState.get(OPEN_API_STATE_KEY) as ResolvedOpenApiOptions | undefined;
	if (!options) {
		throw new Error(
			'No OpenAPI options found. Add the openApi() plugin to site.plugins to use "tb --openapi"',
		);
	}

	const entries: OpenApiRouteEntry[] = [];
	for (const route of site.routes) {
		if (route.type !== SERVER_ROUTE) {
			continue;
		}
		// Don't document the docs page itself
		if (options.docs && route.path === options.docs) {
			continue;
		}
		if (route.endPoint && !route.file) {
			// Inline endpoint
			entries.push({ path: route.path, endPoint: route.endPoint as OpenApiEndPoint });
		} else if (route.file) {
			const file = path.resolve(site.root, route.file);
			const mod = await vite.ssrLoadModule(file);
			entries.push({ path: route.path, endPoint: mod.default });
		}
	}

	const doc = buildOpenApiDocument(entries, options);
	await writeFile(path.resolve(site.root, outFile), JSON.stringify(doc, null, 2) + "\n");

	console.log(
		`OpenAPI document written to ${outFile} (${Object.keys(doc.paths ?? {}).length} paths)`,
	);
}
