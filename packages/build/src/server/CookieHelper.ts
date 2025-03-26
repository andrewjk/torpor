import { SerializeOptions, parse, serialize } from "cookie";

export default class CookieHelper {
	request: Request;
	cookies: Map<string, string> = new Map();

	constructor(request: Request) {
		this.request = request;
	}

	get(name: string): string | undefined {
		// If it's been set, return the updated value
		if (this.cookies.has(name)) {
			return this.cookies.get(name);
		}
		// Otherwise, return the cookie value from the `Cookie` header
		const header = this.request.headers.get("cookie");
		return parse(header ?? "")[name];
	}

	set(name: string, value: string, options?: SerializeOptions) {
		// Set a cookie header with some default values for security
		options ??= {};
		options.httpOnly ??= true;
		options.secure ??= true;
		options.sameSite ??= "lax";
		this.cookies.set(name, serialize(name, value, options));
	}

	delete(name: string, options?: SerializeOptions) {
		// Set a cookie header with an immediate expiry date
		options ??= {};
		options.expires = new Date(0);
		this.cookies.set(name, serialize(name, "", options));
	}
}
