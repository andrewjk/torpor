import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ServerEvent from "../server/ServerEvent";
import { sitemapXml } from "../discovery/sitemap";
import prepareTemplate from "./prepareTemplate";
import type Site from "../site/Site";
import { ERROR_ROUTE, PAGE_ROUTE, PAGE_SERVER_ROUTE, LAYOUT_ROUTE } from "../types/RouteType";

/**
 * How a `prerender` flag can appear on an endpoint: `true`/`false` to
 * include/exclude a page, or a `params` entry list for a dynamic route.
 */
export type PrerenderFlag = boolean | { params: Record<string, unknown>[] };

/** The route shapes the prerenderer resolves from (Router.routes, Site.routes). */
type RouteLike = {
	path: string;
	type: number;
	endPoint: () => Promise<any>;
	subFolder?: string;
};

export type PrerenderPath = {
	path: string;
	params: Record<string, string> | undefined;
};

/**
 * Resolves which page paths should be prerendered, from the routes of a
 * built site, testing in order:
 *
 * 1. the page endpoint's own `prerender` flag, or the inferred-params one
 *    on the sibling `+page.server` endpoint
 * 2. the nearest ancestor `_layout` endpoint's flag
 * 3. the site-level `site.prerender` setting: a boolean default, or a
 *    longest-match map of exact paths (`/about`) and prefixes (`/blog/**`)
 *
 * @param routes The site's routes, including layouts and page server
 *   endpoints, with lazy endpoint loaders
 * @param siteFlag The `site.prerender` value
 * @returns The paths to prerender, with route params for dynamic ones
 */
export async function resolvePrerenderPaths(
	routes: RouteLike[],
	siteFlag: boolean | Record<string, boolean> | undefined,
): Promise<PrerenderPath[]> {
	const result: PrerenderPath[] = [];

	for (const route of routes.filter((r) => r.type === PAGE_ROUTE)) {
		const base = route.path.replace(/\/$/, "");

		const pageFlag = (await endpointFlag(route.endPoint)) as PrerenderFlag | undefined;
		const serverRoute = routes.find(
			(r) => r.type === PAGE_SERVER_ROUTE && r.path === `${base}/~server`,
		);
		const serverFlag = serverRoute
			? ((await endpointFlag(serverRoute.endPoint)) as PrerenderFlag | undefined)
			: undefined;

		const entries = paramsEntriesOf(pageFlag) ?? paramsEntriesOf(serverFlag);
		const ownFlag =
			pageFlag === undefined
				? serverFlag === undefined
					? undefined
					: Boolean(serverFlag)
				: Boolean(pageFlag);
		const resolved =
			ownFlag ?? (await nearestLayoutFlag(routes, route)) ?? siteResolve(route.path, siteFlag);
		if (!resolved) continue;

		if (/\[[^\]]+\]/.test(route.path)) {
			if (!entries?.length) {
				throw new Error(
					`The route "${route.path}" is marked for prerendering, but it has dynamic ` +
						`segments and no params entries were declared. Set ` +
						`\`prerender: { params: [...] }\` on its endpoint.`,
				);
			}
			for (const entry of entries) {
				result.push({ path: expandPath(route.path, entry), params: toStringParams(entry) });
			}
		} else {
			result.push({ path: route.path || "/", params: undefined });
		}
	}

	return result;
}

function paramsEntriesOf(flag: PrerenderFlag | undefined): Record<string, unknown>[] | undefined {
	return typeof flag === "object" && flag !== null ? flag.params : undefined;
}

/**
 * Renders the prerenderable routes to static HTML files in the client
 * output, plus the `_error` page as `404.html` when the site has one.
 *
 * Called by `tb build` after the client and server builds, when the built
 * server entry (with its routes) can be imported directly, and before the
 * adapter's postbuild -- so a prerendered site ships as plain files and
 * any static host can serve it.
 *
 * @param site The loaded site config
 * @returns The number of HTML files written
 */
export default async function runPrerender(site: Site): Promise<number> {
	const serverFolder = path.join(site.root, "dist", "server");
	const clientFolder = path.join(site.root, "dist", "client");
	const serverEntryPath = path.join(serverFolder, "serverEntry.js");

	// Load the built server entry, with its routes baked in
	const serverEntry = (await import(pathToFileURL(serverEntryPath).href)) as {
		load: (ev: unknown, template: string | undefined) => Promise<Response>;
		router: { routes: { path: string; handler: RouteLike }[] };
	};
	const routes = serverEntry.router.routes.map((r) => r.handler);

	// Deserialize the client entry asset name the same way the Cloudflare
	// adapter does, so the template works the same for prerendered output
	let template: string | undefined;
	const siteHtml = path.join(clientFolder, "site.html");
	if (existsSync(siteHtml)) {
		const assets = path.join(clientFolder, "assets");
		let clientScript = (await fs.readdir(assets)).find((f) => f.startsWith("clientEntry-"));
		if (!clientScript) {
			throw new Error("clientEntry.js not found");
		}
		template = prepareTemplate(await fs.readFile(siteHtml, "utf-8"), `/assets/${clientScript}`);
	}

	const entries = await resolvePrerenderPaths(routes, site.prerender);

	// Load functions may read the environment (env() uses globalThis.adapter)
	// @ts-ignore
	globalThis.adapter ??= { env: process.env };

	const failures: string[] = [];
	const skipped: string[] = [];
	let written = 0;
	for (const entry of entries) {
		const url = `http://torpor.build${entry.path}`;
		const request = new Request(url);
		const serverEvent = new ServerEvent(request, entry.params, new URL(url));
		const response = await serverEntry.load(serverEvent, template);

		if (isRedirect(response)) {
			// Load functions redirect for auth and first-run setup, which is
			// expected on a fresh site -- skip the page rather than failing
			// the build, so a site can ship before it's initialized
			skipped.push(`${entry.path} (status ${response.status})`);
			continue;
		}
		if (response.status < 200 || response.status > 299) {
			failures.push(`${entry.path} (status ${await responseStatus(response)})`);
			continue;
		}
		if (!response.headers.get("Content-Type")?.includes("text/html")) {
			failures.push(`${entry.path} (not an HTML response)`);
			continue;
		}

		await writeFileForPath(clientFolder, entry.path, await response.text());
		written++;
	}

	// The error page is useful on every static host, so render it whenever
	// the site has one, even when nothing else is prerendered
	const errorRoute = routes.find((r) => r.type === ERROR_ROUTE);
	if (errorRoute && template !== undefined) {
		const url = "http://torpor.build/_error?status=404";
		const serverEvent = new ServerEvent(new Request(url), undefined, new URL(url));
		const response = await serverEntry.load(serverEvent, template);
		if (isRedirect(response)) {
			// The layout may redirect before the error page renders (e.g. to
			// a setup page on a fresh site) -- skip it; the host's default
			// 404 page is used instead
			skipped.push(`/_error (status ${response.status})`);
		} else if (response.ok && response.headers.get("Content-Type")?.includes("text/html")) {
			await fs.writeFile(path.join(clientFolder, "404.html"), await response.text());
		} else {
			failures.push(`/_error (status ${await responseStatus(response)})`);
		}
	}

	if (skipped.length) {
		console.log(
			`Skipped prerendering ${skipped.length} route${skipped.length === 1 ? "" : "s"} ` +
				`(redirected):\n` +
				skipped.map((s) => `  - ${s}`).join("\n"),
		);
	}

	if (failures.length) {
		throw new Error(
			`Prerendering failed for ${failures.length} route${failures.length === 1 ? "" : "s"}:\n` +
				failures.map((f) => `  - ${f}`).join("\n"),
		);
	}

	// The sitemap, if configured, lists the URLs that were just rendered:
	// the set of pages that are actually static, which is exactly what a
	// build-time sitemap can honestly represent
	if (site.sitemap && site.origin && entries.length > 0) {
		const base = site.basePath;
		const sitemap = sitemapXml(
			site.origin,
			base,
			entries.map((entry) => entry.path),
		);
		await fs.writeFile(
			path.join(
				clientFolder,
				typeof site.sitemap === "string" ? site.sitemap.slice(1) : "sitemap.xml",
			),
			sitemap,
		);
	}

	return written;
}

/**
 * Writes an HTML file for a route path, e.g. `/` into `index.html` and
 * `/about` into `about/index.html`. Guards against route param values
 * escaping the client folder.
 */
async function writeFileForPath(
	clientFolder: string,
	routePath: string,
	html: string,
): Promise<void> {
	const rel = routePath === "/" ? "index.html" : routePath.slice(1) + "/index.html";
	const out = path.resolve(clientFolder, rel);
	const relSafe = path.relative(clientFolder, out);
	if (relSafe.startsWith("..") || path.isAbsolute(relSafe)) {
		throw new Error(`The prerendered path "${routePath}" escaped ${clientFolder}`);
	}
	await fs.mkdir(path.dirname(out), { recursive: true });
	await fs.writeFile(out, html);
}

async function endpointFlag(loader: () => Promise<any>): Promise<PrerenderFlag | undefined> {
	const endPoint = (await loader())?.default;
	return (endPoint as { prerender?: PrerenderFlag } | undefined)?.prerender;
}

/**
 * The nearest ancestor `_layout`'s flag for a page path, or undefined when
 * no layout sets one. Layouts apply within the same subFolder.
 */
async function nearestLayoutFlag(
	routes: RouteLike[],
	route: RouteLike,
): Promise<boolean | undefined> {
	let flag: boolean | undefined;
	let flagLength = -1;
	for (const candidate of routes) {
		if (candidate.type !== LAYOUT_ROUTE || candidate.subFolder !== route.subFolder) continue;
		const base = candidate.path.replace(/\/_layout$/, "");
		const isAncestor = base === "" || route.path === base || route.path.startsWith(base + "/");
		if (!isAncestor) continue;
		const flagOfLayout = (await endpointFlag(candidate.endPoint)) as boolean | undefined;
		if (flagOfLayout !== undefined && base.length > flagLength) {
			flag = flagOfLayout;
			flagLength = base.length;
		}
	}
	return flag;
}

function siteResolve(
	routePath: string,
	siteFlag: boolean | Record<string, boolean> | undefined,
): boolean | undefined {
	if (siteFlag === undefined) return undefined;
	if (typeof siteFlag === "boolean") return siteFlag;

	let flag: boolean | undefined;
	let flagLength = -1;
	for (const [pattern, value] of Object.entries(siteFlag)) {
		const base = pattern.replace(/\/\*\*$/, "");
		const isPrefixMatch =
			base !== pattern && (routePath === base || routePath.startsWith(base + "/"));
		if ((pattern === routePath || isPrefixMatch) && pattern.length > flagLength) {
			flag = value;
			flagLength = pattern.length;
		}
	}
	return flag;
}

function toStringParams(entry: Record<string, unknown>): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(entry)) {
		result[key] = String(value);
	}
	return result;
}

/**
 * Fills a route path's `[param]` and `[...rest]` segments with the values
 * from a params entry.
 */
export function expandPath(routePath: string, entry: Record<string, unknown>): string {
	return routePath.replace(/\[([^\]]+)\]/g, (_match, name: string) => {
		const key = name.replace(/^\.\.\./, "");
		if (!(key in entry)) {
			throw new Error(`Missing param "${key}" for the route "${routePath}" (prerendering)`);
		}
		return String(entry[key]);
	});
}

function isRedirect(response: Response): boolean {
	return response.status >= 300 && response.status < 400;
}

async function responseStatus(response: Response): Promise<string> {
	return `${response.status}${response.status === 303 ? " redirect" : ""}`;
}
