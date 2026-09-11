import type ServerLoadEvent from "../types/ServerLoadEvent";
import { addBaseToPath } from "../site/basePath";

/**
 * A runtime sitemap config, set on `site.sitemap`: the endpoint reads urls
 * from `get` (the database, typically) and serves the XML on each request.
 */
export type SitemapOptions = {
	/** The path to serve, e.g. "/sitemap.xml" */
	path?: string;
	/** The site origin, e.g. "https://example.com". Overrides `site.origin`. */
	origin?: string;
	/** Returns base-free paths for the pages to list, e.g. ["/posts/a"] */
	get: (event: ServerLoadEvent) => string[] | Promise<string[]>;
};

/**
 * Serves the sitemap content for a runtime config: the urls returned by
 * `get`, prefixed with the site origin (and the base path, when the site
 * is mounted under a subpath).
 */
export async function sitemapResponse(
	options: SitemapOptions,
	basePath: string,
	event: ServerLoadEvent,
): Promise<Response> {
	const paths = await options.get(event);
	const xml = sitemapXml(options.origin ?? "", basePath, paths);
	return new Response(xml, {
		headers: { "Content-Type": "application/xml" },
	});
}

/**
 * Builds the sitemap content: one `<url>` per page, with the loc values
 * being the origin (plus the base path, when the site is mounted under a
 * subpath) plus the route path. Values are escaped.
 */
export function sitemapXml(origin: string, base: string, paths: string[]): string {
	const locs = paths.map((routePath) => {
		const path = routePath === "/" ? base || "/" : addBaseToPath(routePath, base);
		return `<loc>${escapeXml(origin)}${escapeXml(path)}</loc>`;
	});
	return (
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		locs.map((loc) => `  <url>\n    ${loc}\n  </url>`).join("\n") +
		`\n</urlset>`
	);
}

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}
