import { node } from "@torpor/adapter-node";
import { Site } from "@torpor/build";

const site: Site = new Site();
site.adapter = node;

site.addRoute("/", {
	page: "./src/Counter.torp",
});

export default site;
