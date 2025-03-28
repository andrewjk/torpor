import { Site } from "@torpor/build";

const site = new Site();

await site.addRouteFolder("./src/routes");

export default site;
