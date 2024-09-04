import path from "path";
import url from "url";
import { AppOptions, RouterSchemaInput, createApp } from "vinxi";
import { config } from "vinxi/plugins/config";
import tera from "../unplugin/dist/vite";
import FileSystemRouter from "./src/router";

export default createApp({
	routers: [
		{
			name: "assets",
			type: "static",
			dir: "./assets",
		},
		{
			name: "server",
			type: "http",
			target: "server",
			handler: "./src/serverEntry.ts",
			routes,
			plugins: () => [
				config("custom", {
					// additional vite options
				}),
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
					// additional vite options
				}),
				tera(),
			],
		},
	],
});

function routes(router: RouterSchemaInput, app: AppOptions) {
	const __filename = url.fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	return new FileSystemRouter(
		{
			dir: path.join(__dirname, "src/routes"),
			extensions: ["js", "ts", "tera"],
		},
		router,
		app,
	);
}
