import { readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import Router from "../site/Router";
import type Budgets from "../types/Budgets";
import type ModulePreloads from "../types/ModulePreloads";
import { PAGE_ROUTE } from "../types/RouteType";

/** How much JavaScript one page loads before it hydrates. */
export interface PageSize {
	path: string;
	files: number;
	raw: number;
	gzip: number;
}

/** How many of the heaviest pages the build report lists. */
const REPORT_LIMIT = 10;

/**
 * Works out how much JavaScript each page route loads before it hydrates:
 * the client entry's chunks, its layouts' and its own, as preloaded by the
 * server (see clientPreloads). Chunks loaded later through dynamic imports
 * aren't counted.
 *
 * @param preloads The client chunks per route, from the client build
 * @param routes The site's routes (path, type and sub folder)
 * @param clientFolder The client build's output folder (`dist/client`)
 */
export default function pageSizes(
	preloads: ModulePreloads,
	routes: { path: string; type: number; subFolder?: string }[],
	clientFolder: string,
): PageSize[] {
	// The router works out each page's layouts, the same way it does when
	// serving them
	const router = new Router().addPages(
		routes.map((r) => ({
			path: r.path,
			type: r.type,
			endPoint: () => Promise.resolve({}),
			subFolder: r.subFolder,
		})),
	);

	const sizes = new Map<string, { raw: number; gzip: number }>();
	const sizeOf = (file: string) => {
		let size = sizes.get(file);
		if (!size) {
			const content = readFileSync(path.join(clientFolder, file));
			size = { raw: content.length, gzip: gzipSync(content).length };
			sizes.set(file, size);
		}
		return size;
	};

	const result: PageSize[] = [];
	for (const route of router.routes) {
		if (route.handler.type !== PAGE_ROUTE) continue;
		const handler = router.match(route.path, new URLSearchParams())?.handler;
		const files = new Set(preloads.entry);
		for (const layout of handler?.path === route.path ? (handler.layouts ?? []) : []) {
			for (const file of preloads.routes[layout.path] ?? []) files.add(file);
		}
		for (const file of preloads.routes[route.path] ?? []) files.add(file);

		let raw = 0;
		let gzip = 0;
		for (const file of files) {
			const size = sizeOf(file);
			raw += size.raw;
			gzip += size.gzip;
		}
		result.push({ path: route.path, files: files.size, raw, gzip });
	}
	return result.sort((a, b) => b.gzip - a.gzip || a.path.localeCompare(b.path));
}

/** The pages over the JavaScript budget, if one is set. */
export function overBudget(pages: PageSize[], budgets: Budgets | undefined): PageSize[] {
	const limit = budgets?.js;
	if (limit === undefined) return [];
	return pages.filter((page) => page.gzip > limit);
}

/**
 * The build report: the heaviest pages (all of them, when there are few),
 * then every page over the budget.
 */
export function formatPageSizes(pages: PageSize[], budgets: Budgets | undefined): string {
	if (pages.length === 0) return "";
	const over = overBudget(pages, budgets);
	const shown = pages.slice(0, REPORT_LIMIT);
	const width = Math.max(...shown.map((page) => page.path.length));
	const row = (page: PageSize) =>
		`  ${page.path.padEnd(width)}  ${kb(page.gzip).padStart(9)}  ` +
		`(${kb(page.raw)} raw, ${page.files} file${page.files === 1 ? "" : "s"})`;

	let lines = ["[torpor] JavaScript loaded by each page before it hydrates (gzipped):"];
	lines.push(...shown.map(row));
	if (pages.length > shown.length) {
		const rest = pages.length - shown.length;
		const lightest = pages[pages.length - 1];
		lines.push(
			`  ...and ${rest} more page${rest === 1 ? "" : "s"}, down to ${kb(lightest.gzip)} (${lightest.path})`,
		);
	}
	if (budgets?.js !== undefined) {
		if (over.length === 0) {
			lines.push(`  All pages are within the ${kb(budgets.js)} budget.`);
		} else {
			lines.push(
				`[torpor] ${over.length} page${over.length === 1 ? " is" : "s are"} over the ` +
					`${kb(budgets.js)} JavaScript budget (site.budgets.js):`,
			);
			const overWidth = Math.max(...over.map((page) => page.path.length));
			lines.push(
				...over.map(
					(page) =>
						`  ${page.path.padEnd(overWidth)}  ${kb(page.gzip).padStart(9)}  ` +
						`(+${kb(page.gzip - budgets.js!)})`,
				),
			);
		}
	}
	return lines.join("\n");
}

function kb(bytes: number): string {
	return `${(bytes / 1000).toFixed(1)} kB`;
}
