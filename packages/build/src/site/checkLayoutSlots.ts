import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parse } from "@torpor/view/compile";
import type Route from "../types/Route";
import { LAYOUT_ROUTE } from "../types/RouteType";
import type Site from "./Site";
import { createApiCallCheck, resolveSpecifier, type RouteCheckIssue } from "./checkRoutes";

/**
 * The default import of a `.torp` component from a `.ts`/`.js` route file,
 * e.g. `import component from "@/views/Layout.torp"`.
 */
const DEFAULT_TORP_IMPORT_RE = /import\s+[A-Za-z_$][\w$]*\s+from\s*["']([^"']+\.torp)["']/;

/**
 * Checks that every `_layout` route renders its default `<slot />`.
 *
 * The layout engine composes pages by passing each layout (and finally the
 * page) as the default slot of its parent, so a layout that never renders
 * `<slot />` drops its entire content: the server renders the layout's own
 * markup with an empty content area (no error), and the first client-side
 * navigation that reuses the layout fails on a null slot region.
 *
 * Runs at build time (failing the build) and at dev startup. Best-effort and
 * static: a layout that renders `<slot />` conditionally (inside `@if`)
 * passes here, and is caught at request time by the server render warning
 * (see site/layoutSlots.ts).
 */
export function checkLayoutSlots(site: Site): RouteCheckIssue[] {
	const issues: RouteCheckIssue[] = [];
	for (const route of site.routes) {
		if (route.type === LAYOUT_ROUTE) {
			issues.push(...checkLayoutSlot(site, route));
		}
	}
	return issues;
}

/**
 * Checks a single layout route's component (the `.torp` route file itself,
 * or the `.torp` file its `.ts`/`.js` endpoint re-exports as its default
 * import). Routes without a file (inline endpoints) can't hold a component,
 * so they are skipped.
 */
export function checkLayoutSlot(site: Site, route: Route): RouteCheckIssue[] {
	if (route.type !== LAYOUT_ROUTE || !route.file) return [];

	const check = createApiCallCheck(site);

	// The component is either the route file itself (.torp) or a .ts/.js
	// endpoint re-exporting a .torp component as its default export
	let torpFile = path.join(site.root, route.file);
	if (!route.file.endsWith(".torp")) {
		const source = readIfExists(torpFile);
		if (source === undefined) return [];
		const match = DEFAULT_TORP_IMPORT_RE.exec(source);
		if (!match) return [];
		const resolved = resolveSpecifier(match[1], torpFile, check);
		if (!resolved) return [];
		torpFile = resolved;
	}

	const source = readIfExists(torpFile);
	if (source === undefined) return [];

	// Parse errors are reported when the file is compiled, not here
	const parsed = parse(source);
	if (!parsed.ok || !parsed.template) return [];
	if (rendersDefaultSlot(parsed.template)) return [];

	return [
		{
			file: route.file,
			line: 1,
			severity: "error",
			message:
				"The layout never renders <slot />, so pages under it render without their content. " +
				"Every _layout component must render <slot />, or pass it down to a child component " +
				"it renders.",
		},
	];
}

function readIfExists(file: string): string | undefined {
	try {
		if (!existsSync(file) || !statSync(file).isFile()) return undefined;
		return readFileSync(file, "utf8");
	} catch {
		return undefined;
	}
}

/**
 * Walks a parsed template looking for a default `<slot />` anywhere in the
 * render tree — including nested inside a child component element, which is
 * how a layout passes the page slot down (e.g. `<Shell><slot /></Shell>`).
 */
// HACK: no types on the internal parse tree nodes (same as the prettier plugin)
function rendersDefaultSlot(template: any): boolean {
	const component = template.components?.[0];
	if (!component) return false;
	return walk(component.markup);
}

function walk(node: any): boolean {
	if (
		(node.type === "element" || node.type === "special") &&
		node.tagName === "slot" &&
		!node.attributes?.some((a: any) => a.name === "name")
	) {
		return true;
	}
	return (node.children ?? []).some(walk);
}
