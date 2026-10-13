import cloudflare from "./adapter";
import cloudflareDev from "./cloudflareDev";

export { cloudflare, cloudflareDev };

declare global {
	interface TorporEnv {
		/**
		 * Cloudflare Pages serves the site's static assets through this
		 * binding. Structurally compatible with the `Fetcher` type from
		 * `@cloudflare/workers-types`, which the app can reference for the
		 * full type.
		 */
		ASSETS?: {
			fetch(request: Request): Promise<Response>;
		};
	}
}
