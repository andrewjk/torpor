import torpor from "@torpor/unplugin/vite";
import { defineConfig } from "wxt";

export default defineConfig({
	srcDir: "src",
	//manifest: {
	//	permissions: ["storage", "declarativeNetRequest"],
	//	host_permissions: ["<all_urls>"],
	//},
	webExt: {
		startUrls: ["http://localhost:7059"],
	},
	vite: () => ({
		plugins: [torpor()],
	}),
});
