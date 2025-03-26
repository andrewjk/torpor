import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		rollupOptions: {
			input: fileURLToPath(new URL("./src/app/site.html", import.meta.url)),
		},
	},
});
