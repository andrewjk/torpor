import path from "node:path";
import type ModulePreloads from "../types/ModulePreloads";

/** An entry in Vite's build manifest (`.vite/manifest.json`). */
export interface ViteManifestChunk {
	file: string;
	src?: string;
	name?: string;
	isEntry?: boolean;
	imports?: string[];
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
 */
export default function clientPreloads(
	manifest: Record<string, ViteManifestChunk>,
	root: string,
	routes: { path: string; file: string }[],
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

	const preloads: Record<string, string[]> = {};
	for (const route of routes) {
		const key = keysByFile.get(path.resolve(route.file));
		if (!key) continue;
		const files = closure(key).filter((file) => !inEntry.has(file));
		if (files.length > 0) {
			preloads[route.path] = files;
		}
	}
	return { entry, routes: preloads };
}
