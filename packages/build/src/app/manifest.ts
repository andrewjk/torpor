import path from "node:path";
import { Plugin } from "vite";
import App from "./App";

const moduleId = "@torpor/build/manifest";

/**
 * A Vite plugin that provides information about the app to both clientEntry and
 * serverEntry
 */
export default function manifest(app: App): Plugin {
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
    ${app.routes.map((r) => `{ path: "${r.path}", file: "${r.file}", endPoint: () => import(/* @vite-ignore */ "${path.join(app.root, r.file)}") }`).join(",\n    ")}
  ],
};
`;
			}
		},
	};
}
