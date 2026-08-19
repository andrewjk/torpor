import { node } from "@torpor/adapter-node";
import { Site } from "@torpor/build";
import addRoutes from "./src/routes";

const site: Site = new Site();
site.adapter = node;

addRoutes(site);

export default site;
