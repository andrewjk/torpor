import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The user sets this up
// It will then be passed into entryServer and entryClient in a Vite plugin
// In those files, it will build a Router
export default class App {
	root: string;
	routes: { path: string; file: string }[] = [];

	constructor() {
		this.root = process.cwd();
	}

	async addRouteFolder(folder: string) {
		const routeFolder = path.join(__dirname, folder);
		const routeFiles = await fs.readdir(routeFolder, { recursive: true });

		// // TODO: Need to handle `_` files
		// .filter((route) => !route.path.startsWith("_"))

		for (let file of routeFiles) {
			if (file.endsWith(".ts") || file.endsWith(".js")) {
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
	}

	addRoute(path: string, file: string) {
		this.routes.push({ path, file });
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
