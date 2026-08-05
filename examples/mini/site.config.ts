import { node } from "@torpor/adapter-node";
import { Site } from "@torpor/build";
import addRoutes from "./src/routes";

const site: Site = new Site();
site.adapter = node;

// This is how it's been done -- add a folder of routes (like Next, SvelteKit etc)
//await site.addRouteFolder("./src/routes");

// This is how it could be done -- setup routing here (like Hono, etc)
// Like, the user creates a routes.ts and a Component.torp and writes this and can serve immediately
addRoutes(site);

export default site;
