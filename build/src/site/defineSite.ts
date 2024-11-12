import tera from "@tera/unplugin/vite";
import path from "path";
import { AppOptions, RouterSchemaInput, createApp } from "vinxi";
import { config } from "vinxi/plugins/config";
import type UserConfig from "../types/UserConfig";
import FileSystemRouter from "./FileSystemRouter";

export default function defineSite(options?: UserConfig) {
	// Set the port
	process.env.PORT = (options?.port || 7354).toString();

	// Get Vinxi to create and serve the app
	return createApp({
		routers: [
			{
				name: "assets",
				type: "static",
				dir: "./src/assets",
			},
			// Doesn't look like we can have two server routes?
			// Have to put api in /routes
			// Maybe we can support having /routes/api and routes/site and stripping /site from the start?
			//{
			//	name: "api",
			//	type: "http",
			//	target: "server",
			//	// TODO: change this when published
			//	handler: "node_modules/@tera/build/src/site/serverEntry.ts",
			//	routes: apiRoutes,
			//	plugins: () => [config("custom", viteOptions())],
			//},
			{
				name: "server",
				type: "http",
				target: "server",
				// TODO: change this when published
				handler: "node_modules/@tera/build/src/site/serverEntry.ts",
				routes,
				plugins: () => [config("custom", viteOptions()), tera({ server: true })],
			},
			{
				name: "client",
				type: "client",
				target: "browser",
				// TODO: change this when published
				handler: "node_modules/@tera/build/src/site/clientEntry.ts",
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
			dir: path.resolve("src/routes"),
			extensions: ["js", "ts"],
		},
		router,
		app,
	);
}

function viteOptions() {
	return {
		resolve: {
			alias: {
				"@": path.resolve("src"),
			},
		},
	};
}
