/**
 * The site's base path, e.g. "/app" when the site is mounted under a
 * subpath. Inherited from `site.basePath` through the manifest at startup
 * (see serverEntry and clientEntry); default "" when the site is served
 * from the root.
 *
 * Server code and user markup are written base-free: the server strips the
 * base from incoming URLs before routing (requests that don't carry it get
 * a 404), and adds it back to generated HTML attributes, redirect
 * locations and paths built with `route()`. The client router does the
 * mirror image: strips for matching, adds for data fetches.
 */
let basePath = "";

/**
 * Validates and sets the site's base path: must be "", start with "/" and
 * not end with "/" (a trailing slash is stripped, "/" is normalized to "")
 */
export function setBasePath(value: string | undefined): void {
	basePath = normalizeBasePath(value);
}

export function getBasePath(): string {
	return basePath;
}

/**
 * Normalizes a base path value, throwing a descriptive error when it
 * can't be one. Trailing slashes are stripped and "/" is normalized to "".
 */
export function normalizeBasePath(value: string | undefined): string {
	const trimmed = (value ?? "").trim();
	if (trimmed === "" || trimmed === "/") return "";
	if (!trimmed.startsWith("/") || /\s/.test(trimmed)) {
		throw new Error(
			`The base path must be an absolute path without spaces (e.g. "/app"), ` + `got "${value}"`,
		);
	}
	return trimmed.replace(/\/+$/, "");
}

/**
 * Normalizes a site origin value, throwing a descriptive error when it
 * isn't an absolute http(s) origin without a path or spaces.
 */
export function normalizeOrigin(value: string | undefined): string {
	const trimmed = (value ?? "").trim();
	if (trimmed === "") {
		throw new Error(`The site origin is empty (e.g. "https://example.com")`);
	}
	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		throw new Error(
			`The site origin must be an absolute url (e.g. "https://example.com"), got "${value}"`,
		);
	}
	if (
		(url.protocol !== "https:" && url.protocol !== "http:") ||
		url.pathname !== "/" ||
		/\s/.test(trimmed)
	) {
		throw new Error(
			`The site origin must be an http(s) url without spaces or a path ` +
				`(e.g. "https://example.com"), got "${value}"`,
		);
	}
	// A trailing slash is allowed
	return url.origin;
}

/**
 * Strips the base from a URL's pathname, copying the URL so it can be used
 * for routing without disturbing the request. Returns undefined when there
 * is a base and the URL doesn't carry it -- the caller should then return
 * a not-found response, since the site only serves requests under its
 * mount point.
 */
export function stripBaseFromUrl(url: URL, base: string): URL | undefined {
	const stripped = new URL(url);
	if (!base) return stripped;
	if (stripped.pathname === base) {
		stripped.pathname = "/";
		return stripped;
	}
	if (stripped.pathname.startsWith(base + "/")) {
		stripped.pathname = stripped.pathname.slice(base.length) || "/";
		return stripped;
	}
	return undefined;
}

/**
 * Adds the base to an absolute path, idempotent for paths that already
 * carry it. Relative paths ("other/page"), protocol-relative ("//...") and
 * full URLs are left alone.
 */
export function addBaseToPath(path: string, base: string): string {
	if (!base || !path.startsWith("/") || path.startsWith("//")) return path;
	if (path === "/") return base + "/";
	if (path === base || path.startsWith(base + "/")) return path;
	return base + path;
}

/**
 * Rewrites absolute-path `href`, `action` and `src` attribute values in
 * rendered HTML, so that markup can be written base-free. Values that
 * aren't absolute paths (relative, "//...", "http://...", "mailto:...")
 * are left alone, as are ones that already carry the base.
 */
export function rewriteBaseInHtml(html: string, base: string): string {
	if (!base) return html;
	return html.replace(
		/\s(href|action|src)\s*=\s*("([^"]*)"|'([^']*)')/g,
		(match, name: string, _quoted: string, double: string, single: string) => {
			const value = double ?? single ?? "";
			const rewritten = addBaseToPath(value, base);
			if (rewritten === value) return match;
			return ` ${name}="${rewritten}"`;
		},
	);
}
