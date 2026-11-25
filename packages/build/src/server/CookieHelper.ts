import { type SerializeOptions, parseCookie, stringifySetCookie } from "cookie";

/**
 * Browsers silently drop `Set-Cookie` headers above ~4096 bytes, so a cookie
 * this large is a bug in the caller (the session helper, flash messages, or
 * app code) rather than a header worth sending. Throwing here makes the
 * failure visible instead of losing the cookie with no trace.
 */
const MAX_COOKIE_BYTES = 4096;

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

		this.cookies.set(name, serializeCookie(name, value, options));
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

		this.cookies.set(name, serializeCookie(name, "", options));
	}
}

function serializeCookie(name: string, value: string, options: SerializeOptions): string {
	const serialized = stringifySetCookie({ name, value, ...options });
	const bytes = new TextEncoder().encode(serialized).length;
	if (bytes > MAX_COOKIE_BYTES) {
		throw new Error(
			`The "${name}" cookie is too large (${bytes} bytes; browsers limit a cookie to ` +
				`${MAX_COOKIE_BYTES} bytes) and would be silently dropped. No cookie was set; ` +
				"store less data, or keep it server-side instead.",
		);
	}
	return serialized;
}
