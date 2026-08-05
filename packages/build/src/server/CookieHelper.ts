import { type SerializeOptions, parseCookie, stringifySetCookie } from "cookie";

export default class CookieHelper {
	request: Request;
	cookies: Map<string, string> = new Map();

	constructor(request: Request) {
		this.request = request;
	}

	get(name: string): string | undefined {
		// If it's been set, return the value from the map
		if (this.cookies.has(name)) {
			// The stored value is a serialized Set-Cookie header; pull the
			// "name=value" prefix off and re-parse to get just the value
			return parseCookie(this.cookies.get(name)!)[name];
		}

		// Otherwise, return the value from the `cookie` header
		const header = this.request.headers.get("Cookie");
		return parseCookie(header ?? "")[name];
	}

	set(name: string, value: string, options?: SerializeOptions): void {
		// Set a cookie header with some default values for security
		options ??= {};
		options.httpOnly ??= true;
		options.secure ??= true;
		options.sameSite ??= "lax";

		this.cookies.set(name, stringifySetCookie({ name, value, ...options }));
	}

	delete(name: string, options?: SerializeOptions): void {
		// Set a cookie header with an empty value and an immediate expiry date.
		// Apply the same secure defaults as `set` so a previously-set Secure
		// cookie is actually overridden by the deletion.
		options ??= {};
		options.httpOnly ??= true;
		options.secure ??= true;
		options.sameSite ??= "lax";
		options.expires = new Date(0);

		this.cookies.set(name, stringifySetCookie({ name, value: "", ...options }));
	}
}
