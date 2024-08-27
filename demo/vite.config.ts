import { defineConfig } from "vite";
import tera from "../unplugin-tera/dist/vite";

export default defineConfig({
	plugins: [
		tera({
			/* options */
		}),
	],
});
