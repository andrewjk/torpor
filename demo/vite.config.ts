import { createApp } from "vinxi";
import { config } from "vinxi/plugins/config";
import tera from "../unplugin/dist/vite";

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
			plugins: () => [
				config("custom", {
					// additional vite options
				}),
				tera(),
			],
		},
	],
});
