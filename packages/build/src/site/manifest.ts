import path from "node:path";
import { Plugin } from "vite";
import Site from "./Site";

const moduleId = "@torpor/build/manifest";

/**
 * A Vite plugin that provides information about the app to both clientEntry and
 * serverEntry.
 */
export default function manifest(app: Site, server = false): Plugin {
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
		load(id) {
			if (id === moduleId) {
				return `
export default {
  routes: [
    ${app.routes
			.filter((r) => server || !/server\.(ts|js)$/.test(r.file))
			.map(
				(r) =>
					`{ path: "${r.path}", file: "${r.file}", type: ${r.type}, endPoint: () => import(/* @vite-ignore */ "${path.join(app.root, r.file)}") }`,
			)
			.join(",\n    ")}
  ],
};
`;
			}
		},
	};
}
