import runBuild from "./runBuild";
import runDev from "./runDev";
import { loadSite } from "./loadSite";
import runPreview from "./runPreview";

export { loadSite };

export default async function run(
	folder: string,
	mode: "dev" | "build" | "preview",
): Promise<void> {
	const { site, vite } = await loadSite(folder);
	try {
		switch (mode) {
			case "dev": {
				// The config Vite server is passed along so the dev server can
				// watch the config's import graph and re-load it when route
				// definitions (e.g. a routes.ts) change
				await runDev(site, vite);
				break;
			}
			case "build": {
				await runBuild(site);
				break;
			}
			case "preview": {
				await runPreview(site);
				break;
			}
			default: {
				console.log("No mode passed, running in dev");
				await runDev(site, vite);
				break;
			}
		}
	} finally {
		await vite.close();
	}
}
