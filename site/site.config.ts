import { cloudflare } from "@torpor/adapter-cloudflare";
import { Site } from "@torpor/build";

const site: Site = new Site();
site.adapter = cloudflare;

await site.addRouteFolder("./src/routes");

export default site;
