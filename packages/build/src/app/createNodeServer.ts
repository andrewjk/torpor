import { createServer } from "node:http";
import { createFetchHandler } from "./NodeFetchHandler";

export default function createNodeServer(handler: (req: Request) => Response | Promise<Response>) {
	// Create a server, polyfill it so that it can handle standard fetch methods,
	// and pass our app fetch method to the handler
	return createServer(createFetchHandler(handler));
}
