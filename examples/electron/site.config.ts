import { electron } from "@torpor/adapter-electron";
import { Site } from "@torpor/build";
import addRoutes from "./src/routes";

const site: Site = new Site();
site.adapter = electron({
	window: { width: 1000, height: 700, title: "Torpor Electron" },
});

addRoutes(site);

export default site;
