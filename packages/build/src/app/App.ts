// The user sets this up
// It will then be passed into entryServer and entryClient in a Vite plugin
// In those files, it will build a Router
export default class App {
	root: string;
	routes: { path: string; file: string }[] = [];

	constructor() {
		this.root = process.cwd();
	}

	addRoute(path: string, file: string) {
		this.routes.push({ path, file });
	}
}
