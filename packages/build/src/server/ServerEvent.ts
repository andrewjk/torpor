import CookieHelper from "./CookieHelper";
import HeaderHelper from "./HeaderHelper";

export default class ServerEvent {
	request: Request;
	response?: Response;
	// TODO: Should we cast types??
	params?: Record<string, string>;

	adapter: any;

	cookies: CookieHelper;
	headers: HeaderHelper;

	constructor(request: Request, params?: Record<string, string>) {
		this.request = request;
		this.params = params;
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
}
