// @ts-ignore
import Server from "%SERVER_CLASS%";
// @ts-ignore
import { load } from "%SERVER_SCRIPT%";

// This file has the above imports replaced and is then compiled to create a Cloudflare Pages Worker

const template = `%HTML_TEMPLATE%`;

// Send all requests through Server to handle middleware, cookies, headers, etc
const server = new Server();
server.add("*", async (ev: any) => {
	try {
		// Render the app HTML (or fetch server data etc) via serverEntry's
		// exported `load` function
		return await load(ev, template);
	} catch (e: any) {
		// TODO: Message?
		console.log("ERROR:", e);
		return new Response(null, {
			status: 500,
		});
	}
});

export default {
	async fetch(request: Request, env: any) {
		const url = new URL(request.url);

		// Serve dist/client/assets statically
		if (url.pathname.startsWith("/assets/")) {
			return env.ASSETS.fetch(request);
		}

		// Every request (GET, POST, etc) goes through loadEndPoint
		return await server.fetch(request);
	},
};
