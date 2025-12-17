import torpor from "@torpor/unplugin/vite";
import { defineConfig } from "wxt";

export default defineConfig({
	srcDir: "src",
	webExt: {
		startUrls: ["http://localhost:7059"],
	},
	vite: () => ({
		plugins: [torpor()],
	}),
});
