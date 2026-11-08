/**
 * HTML auto-close analysis for slot regions.
 *
 * When a host wraps each slot region in an element that the HTML parser
 * auto-closes (`<li><slot/></li>`, `<p><slot/></p>`, table parts, …) and the
 * consumer's fill starts with a tag that implies the wrapper's end
 * (`<li>` fill inside `<li><slot/></li>`), the parser re-nests the markup:
 * the slot region's markers end up as siblings of the fill content instead
 * of wrapping it, and hydration can't adopt the region.
 *
 * These helpers let the server builds (JS and restricted) detect the shape —
 * at compile time for static fallbacks, at render time for fill content —
 * and fail with an actionable message instead of shipping broken HTML.
 */

/**
 * The start tags on the left imply the end of the open ancestor tags in the
 * value list, per the HTML "in body" and "in table" insertion modes. E.g.
 * a `<div>` start tag closes an open `<p>`; a `<li>` start tag closes an
 * open `<li>`.
 */
const CLOSES: Record<string, string[]> = {
	li: ["li"],
	dt: ["dt", "dd", "p"],
	dd: ["dt", "dd", "p"],
	p: ["p"],
	address: ["p"],
	article: ["p"],
	aside: ["p"],
	blockquote: ["p"],
	center: ["p"],
	details: ["p"],
	dialog: ["p"],
	dir: ["p"],
	div: ["p"],
	dl: ["p"],
	fieldset: ["p"],
	figcaption: ["p"],
	figure: ["p"],
	footer: ["p"],
	header: ["p"],
	hgroup: ["p"],
	main: ["p"],
	menu: ["p"],
	nav: ["p"],
	ol: ["p"],
	section: ["p"],
	summary: ["p"],
	ul: ["p"],
	h1: ["p"],
	h2: ["p"],
	h3: ["p"],
	h4: ["p"],
	h5: ["p"],
	h6: ["p"],
	pre: ["p"],
	listing: ["p"],
	form: ["p"],
	plaintext: ["p"],
	table: ["p"],
	hr: ["p"],
	xmp: ["p"],
	option: ["option"],
	optgroup: ["option", "optgroup"],
	td: ["td", "th"],
	th: ["td", "th"],
	tr: ["tr", "td", "th"],
	caption: ["caption", "tr", "td", "th", "tbody", "thead", "tfoot", "colgroup"],
	colgroup: ["colgroup", "caption", "tr", "td", "th", "tbody", "thead", "tfoot"],
	tbody: ["tbody", "thead", "tfoot", "tr", "td", "th", "caption", "colgroup"],
	thead: ["tbody", "thead", "tfoot", "tr", "td", "th", "caption", "colgroup"],
	tfoot: ["tbody", "thead", "tfoot", "tr", "td", "th", "caption", "colgroup"],
};

/** Tags that some start tag can auto-close (the union of the CLOSES values). */
export const AUTO_CLOSEABLE: ReadonlySet<string> = new Set(Object.values(CLOSES).flat());

/** The first start tag in an HTML fragment, lowercased (undefined if none). */
export function firstElementTag(html: string): string | undefined {
	const match = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(html);
	return match?.[1]?.toLowerCase();
}

/**
 * Whether a fragment whose first element is `firstTag` would auto-close any
 * of the open `ancestor` tags (most recent ancestor last, like a stack).
 */
export function closesAncestor(firstTag: string, ancestors: string[]): boolean {
	const closed = CLOSES[firstTag.toLowerCase()];
	if (closed === undefined) return false;
	return ancestors.some((ancestor) => closed.includes(ancestor));
}

/**
 * The message for a detected re-nesting, naming the offending fill tag, the
 * wrapper it closes, and the fix.
 */
export function autoCloseMessage(firstTag: string, ancestor: string): string {
	return (
		`Slot content was re-nested by the HTML parser: the fill starts with <${firstTag}>, ` +
		`which auto-closes the enclosing <${ancestor}> around the slot ` +
		`(e.g. <li><slot/></li> with an <li> fill). Wrap the slot in a different ` +
		`element (e.g. <div>), or start the fill with a tag that nests there.`
	);
}
