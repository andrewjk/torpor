import path from "path";
import url from "url";
import { AppOptions, RouterSchemaInput, createApp } from "vinxi";
import { config } from "vinxi/plugins/config";
import tsconfigPaths from "vite-tsconfig-paths";
import tera from "../unplugin/dist/vite";
import FileSystemRouter from "./src/router";

export default createApp({
	routers: [
		{
			name: "assets",
			type: "static",
			dir: "./src/assets",
		},
		{
			name: "server",
			type: "http",
			target: "server",
			handler: "./src/serverEntry.ts",
			routes,
			plugins: () => [
				config("custom", {
					// Vite options
					resolve: {
						alias: {
							"@": path.resolve(__dirname(), "./src"),
						},
					},
				}),
				tsconfigPaths(),
				tera({ server: true }),
			],
		},
		{
			name: "client",
			type: "client",
			target: "browser",
			handler: "./src/clientEntry.ts",
			base: "/_build",
			routes,
			plugins: () => [
				config("custom", {
					// Vite options
					resolve: {
						alias: {
							"@": path.resolve(__dirname(), "./src"),
						},
					},
				}),
				tsconfigPaths(),
				tera(),
			],
		},
	],
});

function routes(router: RouterSchemaInput, app: AppOptions) {
	return new FileSystemRouter(
		{
			dir: path.join(__dirname(), "src/routes"),
			extensions: ["js", "ts", "tera"],
		},
		router,
		app,
	);
}

function __dirname() {
	return path.dirname(url.fileURLToPath(import.meta.url));
}
