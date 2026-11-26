import path from "node:path";
import type ModulePreloads from "../types/ModulePreloads";

/** An entry in Vite's build manifest (`.vite/manifest.json`). */
export interface ViteManifestChunk {
	file: string;
	src?: string;
	name?: string;
	isEntry?: boolean;
	imports?: string[];
	css?: string[];
}

/**
 * Works out which chunks each page needs, from the client build's manifest,
 * so the server can emit `<link rel="modulepreload">` tags for them.
 *
 * Without them the browser only sees the client entry script (at the end of
 * the HTML), and finds the page's own chunks once the entry has downloaded
 * and run: a waterfall of HTML, then the entry, then the route's chunks,
 * then their imports. Each list is a chunk's file plus everything it
 * statically imports, transitively; dynamic imports are left to load when
 * they're needed.
 *
 * @param manifest The parsed `.vite/manifest.json`
 * @param root The client build's resolved Vite root, which manifest keys
 * and `src` paths are relative to
 * @param routes Route paths and their absolute source files (page and
 * layout components)
 * @param readStylesheet Reads a stylesheet by its output path (e.g.
 * `assets/x.css`), to find the component styles it contains
 */
export default function clientPreloads(
	manifest: Record<string, ViteManifestChunk>,
	root: string,
	routes: { path: string; file: string }[],
	readStylesheet: (file: string) => string = () => "",
): ModulePreloads {
	const closure = (key: string, seen = new Set<string>()): string[] => {
		if (seen.has(key)) return [];
		seen.add(key);
		const chunk = manifest[key];
		if (!chunk) return [];
		const files = [`/${chunk.file}`];
		for (const imported of chunk.imports ?? []) {
			files.push(...closure(imported, seen));
		}
		return files;
	};

	// Manifest keys are source paths relative to the Vite root
	const keysByFile = new Map<string, string>();
	for (const [key, chunk] of Object.entries(manifest)) {
		keysByFile.set(path.resolve(root, chunk.src ?? key), key);
	}

	const entryKey = Object.keys(manifest).find(
		(key) => manifest[key].isEntry && manifest[key].name === "clientEntry",
	);
	const entry = entryKey ? closure(entryKey) : [];
	const inEntry = new Set(entry);

	// Stylesheets follow the same static imports. Component styles are
	// imported by the component's module (`import "<hash>.css"`), so each
	// lands in the stylesheet of the chunk the component is bundled into
	const stylesClosure = (key: string, seen = new Set<string>()): string[] => {
		if (seen.has(key)) return [];
		seen.add(key);
		const chunk = manifest[key];
		if (!chunk) return [];
		const files = (chunk.css ?? []).map((file) => `/${file}`);
		for (const imported of chunk.imports ?? []) {
			files.push(...stylesClosure(imported, seen));
		}
		return files;
	};
	const entryStyles = entryKey ? unique(stylesClosure(entryKey)) : [];
	const inEntryStyles = new Set(entryStyles);

	const preloads: Record<string, string[]> = {};
	const routeStyles: Record<string, string[]> = {};
	for (const route of routes) {
		const key = keysByFile.get(path.resolve(route.file));
		if (!key) continue;
		const files = closure(key).filter((file) => !inEntry.has(file));
		if (files.length > 0) {
			preloads[route.path] = files;
		}
		const styles = unique(stylesClosure(key)).filter((file) => !inEntryStyles.has(file));
		if (styles.length > 0) {
			routeStyles[route.path] = styles;
		}
	}

	// The component styles in each stylesheet: every scoped rule carries its
	// component's `torp-<hash>` class, and a component's styles are bundled
	// as one unit, so any occurrence means the whole block is there
	const hashes: Record<string, string[]> = {};
	for (const file of new Set([...entryStyles, ...Object.values(routeStyles).flat()])) {
		const found = new Set<string>();
		for (const match of readStylesheet(file.slice(1)).matchAll(/\.torp-([a-z0-9]+)/g)) {
			found.add(match[1]);
		}
		if (found.size > 0) {
			hashes[file] = [...found];
		}
	}

	return {
		entry,
		routes: preloads,
		styles: { entry: entryStyles, routes: routeStyles, hashes },
	};
}

function unique(files: string[]): string[] {
	return [...new Set(files)];
}
