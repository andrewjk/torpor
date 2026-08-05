import { Cookies, SerializeOptions, parseCookie, stringifyCookie } from "cookie";

export default class CookieHelper {
	request: Request;
	cookies: Map<string, string> = new Map();

	constructor(request: Request) {
		this.request = request;
	}

	get(name: string): string | undefined {
		// If it's been set, return the value from the map
		if (this.cookies.has(name)) {
			return parseCookie(this.cookies.get(name)!)[name];
		}

		// Otherwise, return the value from the `cookie` header
		const header = this.request.headers.get("Cookie");
		return parseCookie(header ?? "")[name];
	}

	set(name: string, value: string, options?: SerializeOptions): void {
		const c: Cookies = {}
		c[name] = value;

		// Set a cookie header with some default values for security
		options ??= {};
		options.httpOnly ??= true;
		options.secure ??= true;
		options.sameSite ??= "lax";

		this.cookies.set(name, stringifyCookie(c, options));
	}

	delete(name: string, options?: SerializeOptions): void {
		const c: Cookies = {}
		c[name] = "";

		// Set a cookie header with an immediate expiry date
		options ??= {};
		options.expires = new Date(0);

		this.cookies.set(name, stringifyCookie(c, options));
	}
}
