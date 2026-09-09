import manifest from "@torpor/build/manifest";
import Router from "./Router.ts";
import { type ServerLoad, createServerLoad } from "./serverHandlers.ts";

// Build the router from the Site object created by the user
const router = new Router();
router.addPages(manifest.routes);

//console.log(`routes:\n  ${router.routes.map((r) => r.path).join("\n  ")}`);

export const load: ServerLoad = createServerLoad(router);
