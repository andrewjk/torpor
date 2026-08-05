import type { Plugin } from "vite";
import Server from "../server/Server";
import Site from "../site/Site";

export default interface Adapter {
	prebuild?: (site: Site) => Promise<void> | void;
	postbuild?: (site: Site) => Promise<void> | void;
	/**
	 * Vite plugin(s) used to drive dev mode. The adapter owns where server code
	 * runs (e.g. the default Node runtime, or workerd via miniflare) and how
	 * requests reach it. When omitted, the framework's default Node-runtime dev
	 * plugin is used.
	 */
	dev?: (site: Site) => Plugin | Plugin[] | void;
	/**
	 * Serve the built output (preview). Receives a torpor Server configured to
	 * load the built server entry.
	 */
	serve: (server: Server, site: Site) => void;
}
