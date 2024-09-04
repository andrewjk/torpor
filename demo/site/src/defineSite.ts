import path from "path";
import { AppOptions, RouterSchemaInput, createApp } from "vinxi";
import { config } from "vinxi/plugins/config";
import tera from "../../../unplugin/dist/vite";
import dirName from "./dirName";
import FileSystemRouter from "./router";

export default function defineSite() {
	return createApp({
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
				// TODO: change this when published
				handler: "./site/src/serverEntry.ts",
				routes,
				plugins: () => [config("custom", viteOptions()), tera({ server: true })],
			},
			{
				name: "client",
				type: "client",
				target: "browser",
				// TODO: change this when published
				handler: "./site/src/clientEntry.ts",
				base: "/_build",
				routes,
				plugins: () => [config("custom", viteOptions()), tera()],
			},
		],
	});
}

function routes(router: RouterSchemaInput, app: AppOptions) {
	return new FileSystemRouter(
		{
			dir: path.join(dirName(), "src/routes"),
			extensions: ["js", "ts", "tera"],
		},
		router,
		app,
	);
}

function viteOptions() {
	return {
		resolve: {
			alias: {
				"@": path.resolve(dirName(), "./src"),
			},
		},
	};
}
