import { Site } from "@torpor/build";

export default function addRoutes(site: Site) {
	site.addRoute("/", {
		// A .torp component file is used directly as the page component
		page: "./src/Counter.torp",
	});
}
