import { type Adapter, Server } from "@torpor/build";
import createNodeServer from "./createNodeServer";

export default {
	serve: (server: Server) => {
		process.env.PROTOCOL ??= "http:";
		process.env.HOST ??= "localhost";
		process.env.PORT ??= "7059";

		// Create the Node server and start listening
		const url = `${process.env.PROTOCOL}//${process.env.HOST}:${process.env.PORT}`;
		console.log(`\nConnecting to ${url}`);
		const devServer = createNodeServer(server.fetch);
		devServer.listen(parseInt(process.env.PORT), process.env.HOST, () => {
			console.log(`Listening on ${url}\n`);
		});
	},
} satisfies Adapter;
