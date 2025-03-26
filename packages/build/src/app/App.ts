import { promises as fs } from "node:fs";
import path from "node:path";
import { Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

//import { fileURLToPath } from "node:url";

// The user sets this up
// It will then be passed into serverEntry and clientEntry in a Vite plugin
// In those files, it will build a Router
// TODO: Rename this to Site

//const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class App {
	root: string;
	routes: { path: string; file: string }[] = [];
	// Is default plugins a bad idea?
	// HACK: Set loose because otherwise it uses a list of allowed extensions
	plugins: Plugin[] = [tsconfigPaths({ loose: true })];

	constructor() {
		this.root = process.cwd();
	}

	async addRouteFolder(folder: string) {
		// TODO: Use this.root
		const routeFolder = path.join(this.root, folder);
		const routeFiles = await fs.readdir(routeFolder, { recursive: true });

		for (let file of routeFiles) {
			// The file must start with `+` or `_` and end with `.js` or `.ts`
			if (/^(\+|_).+(\.js|\.ts)$/.test(path.basename(file))) {
				let routePath = file
					.replace(/^\//, "")
					.replace(/(\.ts|\.js)$/, "")
					.replace(/_hook.server$/, "_hook/~server")
					.replace(/_layout.server$/, "_layout/~server")
					.replace(/\+page.server$/, "~server")
					.replace(/\+page$/, "")
					.replace(/\+server$/, "")
					.replace(/\/$/, "");
				routePath = routePath.length > 0 ? `/${routePath}` : "/";
				file = path.relative(this.root, path.resolve(routeFolder, file));
				this.routes.push({ path: routePath, file });
			}
		}
		this.sortRoutes();
	}

	addRoute(path: string, file: string) {
		this.routes.push({ path, file });
		this.sortRoutes();
	}

	sortRoutes() {
		this.routes = this.routes.sort((a, b) => {
			// Sort [param]s after paths
			// There might be a quicker/easier way to do this
			for (let i = 0; i < Math.min(a.path.length, b.path.length); i++) {
				if (a.path[i] === "[" && b.path[i] !== "[") {
					return 1;
				} else if (b.path[i] === "[" && a.path[i] !== "[") {
					return -1;
				} else if (a.path[i] === b.path[i]) {
					// Keep going...
				} else {
					return a.path[i].localeCompare(b.path[i]);
				}
			}
			return a.path.length - b.path.length;
		});
	}
}
