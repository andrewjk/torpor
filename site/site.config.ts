import { cloudflare } from "@torpor/adapter-cloudflare";
import { Site } from "@torpor/build";

const site: Site = new Site();
site.adapter = cloudflare;

// Warn when a page loads more JavaScript (gzipped) before hydrating than
// the heaviest page does today (/ui/form, ~77 kB). The REPL's compiler loads
// on demand, so it doesn't count
site.budgets = { js: 80_000 };

await site.addRouteFolder("./src/routes");

export default site;
