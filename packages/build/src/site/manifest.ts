import { readFileSync } from "node:fs";
import path from "node:path";
import { Plugin } from "vite";
import Site from "./Site";

const moduleId = "@torpor/build/manifest";

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
				return `
${!serverRequest ? "const load = { default: { load: true } };" : ""}
export default {
  routes: [
    ${site.routes
			.map((r) => {
				let endPoint: string;
				if (serverRequest || !/server\.(ts|js)$/.test(r.file)) {
					endPoint = `() => import(/* @vite-ignore */ "${path.join(site.root, r.file)}")`;
				} else {
					// On the client, for a server route, we need to check
					// whether there's a load function and set a dummy endPoint
					// if so. The correct endpoint will be hit in clientEntry
					// HACK: Should do this better than checking for `load:` in source...
					const haveLoad = readFileSync(path.join(site.root, r.file)).includes("load:");
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
