/**
 * A function that rewrites the URLs in `href`, `src` and `action` attributes
 * as the client sets them, registered by a host framework with
 * `setUrlRewriter` (e.g. `@torpor/build` adds a site's base path, so markup
 * can be written base-free). Undefined when no rewriting is needed.
 */
let rewriteUrl: ((url: string) => string) | undefined;

/**
 * Registers a function that rewrites the URLs in `href`, `src` and `action`
 * attributes the client sets -- from dynamic attributes, spread props and
 * client-rendered markup -- or clears it with `undefined`. Fragments already
 * cached are not rewritten again, so register it before the first render.
 */
export function setUrlRewriter(rewriter: ((url: string) => string) | undefined): void {
	rewriteUrl = rewriter;
}

const URL_ATTRIBUTES = new Set(["href", "src", "action"]);

/** An attribute value, with its URL rewritten if it's a URL attribute. */
export function urlAttributeValue(name: string, value: any): any {
	if (rewriteUrl === undefined || typeof value !== "string") return value;
	return URL_ATTRIBUTES.has(name.toLowerCase()) ? rewriteUrl(value) : value;
}

/** Rewrites the URL attributes of the elements in a freshly parsed template. */
export function rewriteUrlsIn(root: DocumentFragment | Element): void {
	if (rewriteUrl === undefined) return;
	const elements: Element[] = [...root.querySelectorAll("[href], [src], [action]")];
	if (root instanceof Element && root.matches("[href], [src], [action]")) {
		elements.push(root);
	}
	for (const el of elements) {
		for (const name of URL_ATTRIBUTES) {
			const value = el.getAttribute(name);
			if (value !== null) {
				const rewritten = rewriteUrl(value);
				if (rewritten !== value) el.setAttribute(name, rewritten);
			}
		}
	}
}
