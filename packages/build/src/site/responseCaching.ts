import type ServerEvent from "../server/ServerEvent";
import type CacheOptions from "../server/types/CacheOptions";
import { DATA_REQUEST_HEADER } from "../dataRequest";

/** The default for responses that read or set cookies. */
const PRIVATE_DEFAULT = "private, no-cache";

let warnedPublicCookies = false;

/**
 * A weak ETag for a response body, from a hash of its content. Content-based,
 * so it changes whenever the body does: a matching `If-None-Match` only ever
 * saves sending the same bytes again.
 */
export async function etagOf(body: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(body));
	let binary = "";
	for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
	const hash = btoa(binary).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
	return `W/"${hash}"`;
}

/** Builds a `Cache-Control` value from merged cache options. */
export function cacheControlOf(options: CacheOptions): string {
	if (options.noStore) return "no-store";
	const parts: string[] = [options.private ? "private" : "public"];
	if (options.maxAge !== undefined) parts.push(`max-age=${options.maxAge}`);
	else parts.push("no-cache");
	if (options.sMaxAge !== undefined && !options.private) parts.push(`s-maxage=${options.sMaxAge}`);
	if (options.staleWhileRevalidate !== undefined) {
		parts.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
	}
	return parts.join(", ");
}

/**
 * Applies the request's caching to its response, as the last step of
 * handling it:
 *
 * - A response that read or set a cookie (the session, a flash message) is
 *   `private` unless the code that handled it explicitly said otherwise,
 *   so a CDN can't serve one user's page to another
 * - The `event.cache()` settings become `Cache-Control` and `Vary` on 2xx
 *   GET responses, unless the response set its own `Cache-Control`
 * - A response whose ETag matches the request's `If-None-Match` becomes a
 *   304 without a body
 */
export function finishCaching(ev: ServerEvent, response: Response, dev: boolean): Response {
	const method = ev.request.method;
	if (method !== "GET" && method !== "HEAD") return response;

	const usesCookies = ev.cookies.read || ev.cookies.cookies.size > 0;
	const options = ev.cacheOptions;
	const ok = response.status >= 200 && response.status < 300;
	const hasOwn = response.headers.has("Cache-Control") || hasHeader(ev, "Cache-Control");

	let cacheControl: string | undefined;
	let vary: string[] = [];
	if (!hasOwn) {
		if (ok && options) {
			const merged = { ...options };
			if (usesCookies && merged.private === undefined) {
				merged.private = true;
			} else if (usesCookies && merged.private === false && dev && !warnedPublicCookies) {
				warnedPublicCookies = true;
				console.warn(
					`[torpor] ${ev.url.pathname} read or set a cookie but is cached with ` +
						"`private: false`, so shared caches (CDNs) may serve it to other users. " +
						"Only do this if its content doesn't depend on the cookie.",
				);
			}
			cacheControl = cacheControlOf(merged);
			vary = options.vary ?? [];
		} else if (usesCookies) {
			cacheControl = PRIVATE_DEFAULT;
		} else if (ok && ev.request.headers.has(DATA_REQUEST_HEADER)) {
			// Client data responses are always revalidated, so the browser
			// keeps them for their ETag but never serves them unchecked
			cacheControl = "no-cache";
		}
	}

	if (cacheControl || vary.length > 0) {
		response = mutable(response);
		if (cacheControl) response.headers.set("Cache-Control", cacheControl);
		for (const name of vary) response.headers.append("Vary", name);
	}

	const etag = response.headers.get("ETag");
	if (etag && response.status === 200 && matches(ev.request.headers.get("If-None-Match"), etag)) {
		const headers = new Headers();
		for (const name of ["Cache-Control", "ETag", "Vary", "Content-Location", "Expires"]) {
			const value = response.headers.get(name);
			if (value) headers.set(name, value);
		}
		return new Response(null, { status: 304, headers });
	}

	return response;
}

/** Whether a header was set through `event.headers`. */
function hasHeader(ev: ServerEvent, name: string): boolean {
	const lower = name.toLowerCase();
	for (const key of ev.headers.headers.keys()) {
		if (key.toLowerCase() === lower) return true;
	}
	return false;
}

/** Whether an `If-None-Match` value matches an ETag (weak comparison). */
function matches(ifNoneMatch: string | null, etag: string): boolean {
	if (!ifNoneMatch) return false;
	if (ifNoneMatch.trim() === "*") return true;
	const opaque = (tag: string) => tag.trim().replace(/^W\//, "");
	return ifNoneMatch.split(",").some((tag) => opaque(tag) === opaque(etag));
}

/** The response, or a copy whose headers can be changed. */
function mutable(response: Response): Response {
	try {
		response.headers.set("X-Torpor-Probe", "1");
		response.headers.delete("X-Torpor-Probe");
		return response;
	} catch {
		// A fetched Response's headers are immutable
		return new Response(response.body, response);
	}
}
