import tera from "@tera/unplugin/vite";
import path from "path";
import { AppOptions, RouterSchemaInput, createApp } from "vinxi";
import { config } from "vinxi/plugins/config";
import type UserConfig from "../types/UserConfig";
import FileSystemRouter from "./FileSystemRouter";

export default function defineSite(options?: UserConfig) {
	// Set the port
	process.env.PORT = (options?.port || 5173).toString();

	// Get Vinxi to create and serve the app
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
				handler: "node_modules/@tera/kit/src/site/serverEntry.ts",
				routes,
				plugins: () => [config("custom", viteOptions()), tera({ server: true })],
			},
			{
				name: "client",
				type: "client",
				target: "browser",
				// TODO: change this when published
				handler: "node_modules/@tera/kit/src/site/clientEntry.ts",
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
