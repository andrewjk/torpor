import type Site from "../site/Site";

/**
 * A Torpor site plugin. A plugin is a function that receives the Site and
 * sets itself up on it, typically by registering routes (e.g. an OpenAPI
 * document endpoint) or adding configuration.
 *
 * Plugins are added to `site.plugins` in the site config file, and are run
 * once when the config is loaded (for dev and build), and once when the
 * server starts up in production:
 *
 * ```ts
 * import { Site } from "@torpor/build";
 * import { openApi } from "@torpor/build/openapi";
 *
 * const site = new Site();
 * site.addRouteFolder("src/routes");
 * site.plugins = [openApi()];
 * export default site;
 * ```
 */
type SitePlugin = (site: Site) => void | Promise<void>;

export default SitePlugin;
