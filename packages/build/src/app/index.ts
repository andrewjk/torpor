import { createServer } from "node:http";
import App from "./App";
import { createFetchHandler } from "./NodeFetchHandler";
import ServerEvent from "./ServerEvent";

// Create a dummy App
const app = new App();
app.get("/", home);

function home(ev: ServerEvent) {
	return new Response("hey");
}

// Read args
const host = "127.0.0.1";
const port = process.argv.includes("--port")
	? parseInt(process.argv[process.argv.indexOf("--port") + 1])
	: 3000;

// Create a server, polyfill it so that it can handle standard fetch methods,
// and pass our app fetch method to the handler
const server = createServer(createFetchHandler(app.fetch));

// Start the server with the supplied args
server.listen(port, host, () => {
	console.log(`Listening on ${host}:${port}`);
});
