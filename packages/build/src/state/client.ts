import type ClientState from "../types/ClientState";

const CLIENT_SYMBOL: unique symbol = Symbol.for("torp.Client");

const client: ClientState =
	// @ts-ignore
	(globalThis[CLIENT_SYMBOL] ??= {
		// @ts-ignore This will definitely, 100% get set
		router: null,
		layoutStack: [],
		// TODO: Probably expire after 30 seconds or something?
		prefetchedData: {},
	});

export default client;
