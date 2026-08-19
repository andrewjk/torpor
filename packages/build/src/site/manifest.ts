import { readFileSync } from "node:fs";
import path from "node:path";
import { Plugin } from "vite";
import Site from "./Site";

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

				// If there are inline endpoints and we're building for the
				// server, we need to import the config file to access them.
				// On the client, the config file is never imported, keeping
				// server code out of the client bundle.
				const hasInline = site.routes.some((r) => r.endPoint && !r.file);
				const configImport =
					hasInline && serverRequest && site.configFile
						? `import __site from ${JSON.stringify(site.configFile)};`
						: "";

				return `
${!serverRequest ? "const load = { default: { load: true } };" : ""}
${configImport}
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
				return `{ path: "${r.path}", type: ${r.type}, endPoint: ${endPoint}, subFolder: ${sub} }`;
			})
			.join(",\n    ")}
  ],
};
`;
			}
		},
	};
}
