import { type Adapter, Server } from "@torpor/build";
import createNodeServer from "./createNodeServer";

export default {
	serve: (server: Server) => {
		process.env.PROTOCOL ??= "http:";
		process.env.HOST ??= "localhost";
		process.env.PORT ??= "7059";

		// Create the Node server and start listening
		console.log(`\nConnecting to ${process.env.HOST}:${process.env.PORT}`);
		const devServer = createNodeServer(server.fetch);
		devServer.listen(parseInt(process.env.PORT), process.env.HOST, () => {
			console.log(`Listening on ${process.env.HOST}:${process.env.PORT}\n`);
		});
	},
} satisfies Adapter;
