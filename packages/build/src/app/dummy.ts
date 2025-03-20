import { createServer } from "node:http";
import Server from "./Server";
import ServerEvent from "./ServerEvent";
import { createFetchHandler } from "./adapters/node/createFetchHandler";

// Create a dummy App
const app = new Server();
app.get("/", home);
app.use(middle, middle2);

function home(ev: ServerEvent) {
	console.log("method");
	return new Response("hey");
}

async function middle(ev: ServerEvent, next: () => void | Promise<void>) {
	console.log("beginning");
	await next();
	console.log("end");
}

async function middle2(ev: ServerEvent, next: () => void | Promise<void>) {
	console.log("beginning2");
	await next();
	ev.response = new Response("hey there!!!!");
	console.log("end2");
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
