import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type Route from "../types/Route";
import {
	ERROR_ROUTE,
	HOOK_ROUTE,
	HOOK_SERVER_ROUTE,
	LAYOUT_ROUTE,
	LAYOUT_SERVER_ROUTE,
	PAGE_SERVER_ROUTE,
	SERVER_ROUTE,
} from "../types/RouteType";
import tsconfigAliases, { type AliasEntry } from "../utils/tsconfigAliases";
import type Site from "./Site";

/**
 * A problem found in a route file's type annotations by `checkRoutes`.
 */
export interface RouteCheckIssue {
	/** The route file, relative to the site root */
	file: string;
	/** 1-based line number of the annotation */
	line: number;
	severity: "error" | "warning";
	message: string;
}

const ENDPOINT_TYPES = ["PageServerEndPoint", "PageEndPoint", "ServerEndPoint", "ServerHook"];

const USAGE_RE = new RegExp(`\\b(satisfies|as|:)\\s*\\b(${ENDPOINT_TYPES.join("|")})\\b`, "g");

const TYPE_NAME_RE = new RegExp(`^(?:${ENDPOINT_TYPES.join("|")})\\b`);

/**
 * Checks the route files of a site against their type annotations:
 *
 * - Route path annotations (e.g. `PageServerEndPoint<"/posts/[id]">`) must
 *   match the route derived from the file's location, so types can't silently
 *   lie when files move
 * - Exports that widen the endpoint type (`satisfies T as T`, `as T`, or a
 *   variable annotation) are flagged, because they destroy `PageData` /
 *   `PageForm` / param inference
 * - Routes with dynamic params but no route annotation are flagged, because
 *   their params are loosely typed
 *
 * Only `.ts` route files are checked; annotations are matched by the standard
 * type names (renamed imports are not detected). Best-effort, source-level —
 * comments mentioning these patterns may produce false positives.
 */
export function checkRoutes(site: Site): RouteCheckIssue[] {
	const issues: RouteCheckIssue[] = [];
	for (const route of site.routes) {
		issues.push(...checkRoute(site, route));
	}
	return issues;
}

/**
 * Checks a single route's file. Returns no issues for routes without a `.ts`
 * file (`.torp` components, inline endpoints, `.js` files).
 */
export function checkRoute(site: Site, route: Route): RouteCheckIssue[] {
	if (!route.file || !route.file.endsWith(".ts")) return [];
	let source: string;
	try {
		source = readFileSync(path.join(site.root, route.file), "utf8");
	} catch {
		return [];
	}
	return checkRouteSource(source, route.file, expectedAnnotationPath(route), typeNameFor(route));
}

/**
 * Checks a single route file's source. Exported for reuse (e.g. re-checking a
 * changed file during dev).
 * @param source The route file's source code
 * @param file The file path, relative to the site root (used in messages)
 * @param expected The route path derived from the file's location
 * @param typeName The endpoint type name conventionally used by this route
 * type (used in suggestions)
 */
export function checkRouteSource(
	source: string,
	file: string,
	expected: string,
	typeName: string,
): RouteCheckIssue[] {
	const issues: RouteCheckIssue[] = [];
	let sawAnnotation = false;
	USAGE_RE.lastIndex = 0;
	for (let m = USAGE_RE.exec(source); m; m = USAGE_RE.exec(source)) {
		sawAnnotation = true;
		const kind = m[1];
		const usedTypeName = m[2];
		const { routePath, end } = parseTypeArgs(source, m.index + m[0].length);
		const line = lineOf(source, m.index);
		if (routePath !== undefined && routePath !== expected) {
			issues.push({
				file,
				line,
				severity: "error",
				message: `Route annotation "${routePath}" doesn't match this file's route "${expected}" (derived from its location). Did the file move?`,
			});
		}
		if (kind === "as" || kind === ":") {
			issues.push({
				file,
				line,
				severity: "warning",
				message:
					kind === "as"
						? `The \`as ${usedTypeName}\` cast widens the exported type, so PageData/PageForm/param inference falls back to loose types. Use \`satisfies ${usedTypeName}${routePathArg(expected, routePath)}\` without a cast instead.`
						: `The variable annotation widens the exported type, so PageData/PageForm/param inference falls back to loose types. Use \`satisfies ${usedTypeName}${routePathArg(expected, routePath)}\` on the default export instead.`,
			});
		} else {
			const cast = parseAsCast(source, end);
			if (cast) {
				issues.push({
					file,
					line,
					severity: "warning",
					message: `The \`as\` cast after \`satisfies\` widens the exported type, so PageData/PageForm/param inference falls back to loose types. Use \`satisfies ${usedTypeName}${routePathArg(expected, routePath ?? cast.routePath)}\` on its own.`,
				});
				if (cast.routePath !== undefined && cast.routePath !== expected) {
					issues.push({
						file,
						line,
						severity: "error",
						message: `Route annotation "${cast.routePath}" doesn't match this file's route "${expected}" (derived from its location). Did the file move?`,
					});
				}
				// Skip the `as T` so it isn't reported again as a separate cast
				USAGE_RE.lastIndex = cast.end;
			} else if (routePath === undefined && expected.includes("[")) {
				issues.push({
					file,
					line,
					severity: "warning",
					message: `No route path on the annotation, so params are loosely typed. Use \`satisfies ${usedTypeName}<"${expected}">\`.`,
				});
			}
		}
	}
	if (!sawAnnotation && file.endsWith(".ts") && expected.includes("[")) {
		issues.push({
			file,
			line: 1,
			severity: "warning",
			message: `No route annotation, so params are loosely typed. Add \`satisfies ${typeName}<"${expected}">\` to the default export.`,
		});
	}
	return issues;
}

/**
 * Prints issues to the console and returns the number of errors.
 */
export function reportRouteIssues(issues: RouteCheckIssue[]): number {
	for (const issue of issues) {
		console.error(`[torpor] ${issue.severity}: ${issue.file}:${issue.line} ${issue.message}`);
	}
	return issues.filter((i) => i.severity === "error").length;
}

const MAKE_API_RE = /\bmakeApi\s*<\s*(["'])([^"']+)\1\s*,\s*typeof\s+([A-Za-z_$][\w$]*)/g;

const DEFAULT_IMPORT_RE = /\bimport\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s+from\s*(["'])([^"']+)\2/g;

const SKIP_DIRS = new Set(["node_modules", "dist", ".git", ".torpor", ".vite", "coverage"]);

const SOURCE_FILE_RE = /\.(ts|js|torp)$/;

/**
 * Precomputed state for checking `makeApi` calls: the site root, its route
 * files keyed by path, and tsconfig path aliases for resolving imports.
 */
export interface ApiCallCheck {
	root: string;
	routesByFile: Map<string, Route>;
	aliases: AliasEntry[];
}

/**
 * Creates the shared state used by `checkApiCallSource`, so per-file checks
 * (e.g. re-checking a changed file during dev) don't rebuild it.
 */
export function createApiCallCheck(site: Site): ApiCallCheck {
	const routesByFile = new Map<string, Route>();
	for (const route of site.routes) {
		if (route.file) routesByFile.set(route.file.replaceAll("\\", "/"), route);
	}
	return { root: site.root, routesByFile, aliases: tsconfigAliases(site.root) };
}

/**
 * Checks `makeApi<Route, typeof endpoint>` calls across the site's source
 * files: the `Route` argument must match the route derived from the imported
 * endpoint file's location. Calls whose endpoint isn't a type-only import of
 * a known route file are skipped.
 */
export function checkApiCalls(site: Site): RouteCheckIssue[] {
	const check = createApiCallCheck(site);
	const issues: RouteCheckIssue[] = [];
	for (const file of walkSourceFiles(site.root)) {
		let source: string;
		try {
			source = readFileSync(file, "utf8");
		} catch {
			continue;
		}
		issues.push(...checkApiCallSource(source, file, check));
	}
	return issues;
}

/**
 * Checks the `makeApi` calls in a single file's source.
 * @param source The file's source code
 * @param file The file's absolute path (used to resolve relative imports and
 * to derive the path shown in messages)
 * @param check Shared state from `createApiCallCheck`
 */
export function checkApiCallSource(
	source: string,
	file: string,
	check: ApiCallCheck,
): RouteCheckIssue[] {
	const imports = new Map<string, string>();
	for (let m = DEFAULT_IMPORT_RE.exec(source); m; m = DEFAULT_IMPORT_RE.exec(source)) {
		imports.set(m[1], m[3]);
	}
	const issues: RouteCheckIssue[] = [];
	for (let m = MAKE_API_RE.exec(source); m; m = MAKE_API_RE.exec(source)) {
		const specifier = imports.get(m[3]);
		if (!specifier) continue;
		const resolved = resolveSpecifier(specifier, file, check);
		if (!resolved) continue;
		const relFile = path.relative(check.root, resolved).replaceAll("\\", "/");
		const route = check.routesByFile.get(relFile);
		if (!route) continue;
		const expected = expectedAnnotationPath(route);
		if (m[2] !== expected) {
			issues.push({
				file: path.relative(check.root, file).replaceAll("\\", "/"),
				line: lineOf(source, m.index),
				severity: "error",
				message: `makeApi route "${m[2]}" doesn't match the endpoint's route "${expected}" (derived from ${relFile}). Did the endpoint move?`,
			});
		}
	}
	return issues;
}

/**
 * Resolves an import specifier to an existing file: relative specifiers are
 * resolved against the importing file, others against tsconfig path aliases.
 * Bare module specifiers that match no alias return undefined.
 */
export function resolveSpecifier(
	specifier: string,
	fromFile: string,
	check: ApiCallCheck,
): string | undefined {
	let candidate: string | undefined;
	if (specifier.startsWith("./") || specifier.startsWith("../")) {
		candidate = path.resolve(path.dirname(fromFile), specifier);
	} else {
		for (const alias of check.aliases) {
			if (typeof alias.find === "string") {
				if (specifier.startsWith(alias.find)) {
					candidate = path.resolve(alias.replacement, specifier.slice(alias.find.length));
					break;
				}
			} else if (alias.find.test(specifier)) {
				candidate = specifier.replace(alias.find, alias.replacement);
				break;
			}
		}
	}
	if (!candidate) return undefined;
	const probes = [
		candidate,
		`${candidate}.ts`,
		`${candidate}.js`,
		path.join(candidate, "index.ts"),
		path.join(candidate, "index.js"),
	];
	for (const probe of probes) {
		if (existsSync(probe) && statSync(probe).isFile()) return probe;
	}
	return undefined;
}

function walkSourceFiles(root: string): string[] {
	const files: string[] = [];
	const visit = (dir: string): void => {
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			if (entry.isDirectory()) {
				if (!SKIP_DIRS.has(entry.name)) visit(path.join(dir, entry.name));
			} else if (
				entry.isFile() &&
				SOURCE_FILE_RE.test(entry.name) &&
				!entry.name.endsWith(".d.ts")
			) {
				files.push(path.join(dir, entry.name));
			}
		}
	};
	visit(root);
	return files;
}

/**
 * The route path a file's annotation should use, derived from its manifest
 * entry: internal suffixes (`/~server`, `/_layout` etc) are stripped so e.g.
 * `posts/[id]/+page.server.ts` expects `"/posts/[id]"`.
 */
export function expectedAnnotationPath(route: Route): string {
	let p = route.path;
	switch (route.type) {
		case PAGE_SERVER_ROUTE:
			p = p.replace(/\/~server$/, "");
			break;
		case LAYOUT_ROUTE:
			p = p.replace(/\/_layout$/, "");
			break;
		case LAYOUT_SERVER_ROUTE:
			p = p.replace(/\/_layout\/~server$/, "");
			break;
		case HOOK_ROUTE:
			p = p.replace(/\/_hook$/, "");
			break;
		case HOOK_SERVER_ROUTE:
			p = p.replace(/\/_hook\/~server$/, "");
			break;
		case ERROR_ROUTE:
			p = p.replace(/\/_error$/, "");
			break;
	}
	return p === "" ? "/" : p;
}

function typeNameFor(route: Route): string {
	switch (route.type) {
		case PAGE_SERVER_ROUTE:
		case LAYOUT_SERVER_ROUTE:
			return "PageServerEndPoint";
		case SERVER_ROUTE:
			return "ServerEndPoint";
		case HOOK_ROUTE:
		case HOOK_SERVER_ROUTE:
			return "ServerHook";
		default:
			return "PageEndPoint";
	}
}

/**
 * Parses the type arguments that follow an endpoint type name, returning the
 * first argument when it is a string literal (the route path), plus the index
 * after the closing `>` (or after the type name when there are no arguments).
 */
function parseTypeArgs(
	source: string,
	start: number,
): { routePath: string | undefined; end: number } {
	let i = start;
	while (i < source.length && /\s/.test(source[i])) i++;
	if (source[i] !== "<") return { routePath: undefined, end: i };
	i++;
	let depth = 1;
	let routePath: string | undefined;
	let seenComma = false;
	while (i < source.length) {
		const c = source[i];
		if (c === '"' || c === "'") {
			const quote = c;
			let j = i + 1;
			while (j < source.length && source[j] !== quote) {
				if (source[j] === "\\") j++;
				j++;
			}
			if (routePath === undefined && !seenComma) routePath = source.slice(i + 1, j);
			i = j + 1;
			continue;
		}
		if (c === "<") depth++;
		else if (c === ">") {
			depth--;
			if (depth === 0) return { routePath, end: i + 1 };
		} else if (c === "," && routePath === undefined) {
			seenComma = true;
		}
		i++;
	}
	return { routePath, end: i };
}

/**
 * Parses an `as T`-style cast that follows a `satisfies T` usage, returning
 * its optional route path argument and the index after the cast.
 */
function parseAsCast(
	source: string,
	start: number,
): { routePath: string | undefined; end: number } | undefined {
	let i = start;
	while (i < source.length && /\s/.test(source[i])) i++;
	if (!/^as\b/.test(source.slice(i, i + 3))) return undefined;
	i += 2;
	while (i < source.length && /\s/.test(source[i])) i++;
	if (!TYPE_NAME_RE.test(source.slice(i))) return undefined;
	i = i + source.slice(i).match(TYPE_NAME_RE)![0].length;
	return parseTypeArgs(source, i);
}

function routePathArg(expected: string, actual: string | undefined): string {
	// Keep the user's own (correct) path when widening a properly-annotated
	// export; otherwise suggest the path derived from the file's location
	return `<"${actual ?? expected}">`;
}

function lineOf(source: string, index: number): number {
	let line = 1;
	for (let i = 0; i < index; i++) {
		if (source[i] === "\n") line++;
	}
	return line;
}
