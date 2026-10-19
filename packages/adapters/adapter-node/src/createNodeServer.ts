import { IncomingMessage, Server, ServerResponse } from "http";
import { createServer } from "node:http";
import { createFetchHandler } from "./createFetchHandler";
import createUpgradeHandler from "./createUpgradeHandler";

export default function createNodeServer(
	handler: (req: Request) => Response | Promise<Response>,
): Server<typeof IncomingMessage, typeof ServerResponse> {
	// Create a server, polyfill it so that it can handle standard fetch methods,
	// and pass our app fetch method to the handler
	const server = createServer(createFetchHandler(handler));
	// Upgrades (WebSockets etc) bypass the normal request/response listener;
	// route them through the same handler with the raw socket pair attached
	server.on("upgrade", createUpgradeHandler(handler));
	return server;
}
