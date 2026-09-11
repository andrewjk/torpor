import manifest from "@torpor/build/manifest";
import Router from "./Router.ts";
import { setBasePath } from "./basePath.ts";
import { type ServerLoad, createServerLoad } from "./serverHandlers.ts";

// Put adapter-specific functionality in the `adapter` property of
// globalThis for now
setBasePath(manifest.base);

// Build the router from the Site object created by the user
export const router: Router = new Router();
router.addPages(manifest.routes);

//console.log(`routes:\n  ${router.routes.map((r) => r.path).join("\n  ")}`);

export const load: ServerLoad = createServerLoad(router, manifest.base);
