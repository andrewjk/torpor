import CookieHelper from "./CookieHelper";
import HeaderHelper from "./HeaderHelper";

export default class ServerEvent {
	request: Request;
	response: Response | undefined | void;
	/**
	 * Set when the route handler (or a middleware enter hook) threw an
	 * error. Exit hooks can return a Response to handle it; if none does,
	 * the error is rethrown to the caller.
	 */
	error: unknown;
	// TODO: Should we cast types??
	params?: Record<string, string>;

	adapter: any;

	cookies: CookieHelper;
	headers: HeaderHelper;

	// Parsed once per request; Server.fetch passes the URL it already needed
	// for matching so it isn't parsed twice
	#url: URL | undefined;

	/** The request URL, parsed lazily. */
	get url(): URL {
		return (this.#url ??= new URL(this.request.url));
	}

	constructor(request: Request, params?: Record<string, string>, url?: URL) {
		this.request = request;
		this.params = params;
		this.#url = url;
		this.cookies = new CookieHelper(request);
		this.headers = new HeaderHelper(request);

		// Adapters may have added the `adapter` property to globalThis
		// @ts-ignore
		this.adapter = globalThis.adapter;
	}

	addHeaders(): void {
		if (!this.response) {
			throw new Error("Response not created yet");
		}

		for (let cookie of this.cookies.cookies.values()) {
			this.response.headers.append("set-cookie", cookie);
		}

		for (let header of this.headers.headers.entries()) {
			this.response.headers.append(header[0], header[1]);
		}
	}

	/**
	 * Reads the request body as JSON.
	 */
	json(): Promise<unknown> {
		return this.request.json();
	}
}
