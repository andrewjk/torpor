import { Site } from "@torpor/build";
import cloudflare from "@torpor/build/adapters/cloudflare";

const site = new Site();

await site.addRouteFolder("./src/routes");

site.adapter = cloudflare;

export default site;
