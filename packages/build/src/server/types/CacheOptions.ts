/**
 * How a response may be cached, set with `event.cache(...)`. Several calls
 * in one request (e.g. from a layout's load and the page's load) are merged
 * so that the most restrictive wins: the smallest ages, `private` or
 * `noStore` if any call asks for it, and the union of the `vary` headers.
 *
 * It's applied to successful (2xx) GET responses: pages, client data
 * requests and endpoints. Without it, a response that read or set a cookie
 * (the session, say) gets `Cache-Control: private, no-cache`, and other
 * responses get no `Cache-Control` at all.
 */
export default interface CacheOptions {
	/** Seconds that browsers and shared caches may serve the response for */
	maxAge?: number;
	/** Seconds that shared caches (CDNs) may serve it for, overriding `maxAge` */
	sMaxAge?: number;
	/**
	 * Seconds that a cache may serve the response stale for after it expires,
	 * while it fetches a fresh one in the background
	 */
	staleWhileRevalidate?: number;
	/**
	 * Whether only the user's browser may cache the response. Responses that
	 * read or set cookies are private by default; set `false` to let shared
	 * caches store one anyway (only when its content doesn't depend on them)
	 */
	private?: boolean;
	/** Whether the response mustn't be stored at all */
	noStore?: boolean;
	/** Request headers that the response depends on, sent as `Vary` */
	vary?: string[];
}
