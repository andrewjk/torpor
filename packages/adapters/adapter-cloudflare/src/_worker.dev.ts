// The dev counterpart of the production `_worker.ts`. This file is loaded by
// `@cloudflare/vite-plugin` into workerd (via the Vite module runner, so HMR
// works) and is pointed at by the `main` override in the adapter's dev plugin.
//
// Imports here resolve from the consuming site's `node_modules` (just like the
// Node-runtime dev plugin's `vite.ssrLoadModule` paths), and the template is
// provided by the `virtual:torpor-template` module exposed by the adapter's
// companion Vite plugin (which applies `transformIndexHtml` Node-side).

import { Server, load } from "@torpor/build/dev";
// @ts-ignore
import template from "virtual:torpor-template";

// Send all requests through Server to handle middleware, cookies, headers, etc
const server = new Server();
server.add("*", async (ev: any) => {
	try {
		return await load(ev, template);
	} catch (e: any) {
		console.log("ERROR:", e);
		return new Response(null, {
			status: 500,
		});
	}
});

export default {
	async fetch(request: Request, env: any): Promise<Response> {
		// Put adapter-specific functionality in the `adapter` property of
		// globalThis for now, matching the production _worker.ts
		// @ts-ignore
		globalThis.adapter = { env };
		return await server.fetch(request);
	},
};
