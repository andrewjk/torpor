import formatText from "../render/formatText";

/**
 * The single place the server-side escaping rules live.
 *
 * Client helpers assign to `textContent`/`setAttribute`, so they need no
 * escaping; everything that interpolates into a server-rendered HTML string
 * goes through one of these two functions instead.
 */

const TEXT_ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
};

/**
 * Escapes a value for HTML text content: `&`, `<` and `>` could otherwise be
 * parsed as markup. Values are formatted with the shared `formatText` first
 * (null/undefined become `""`, proxies are unwrapped).
 */
export function escapeText(value: any): string {
	return formatText(value).replace(/[&<>]/g, (c) => TEXT_ESCAPES[c]);
}

/**
 * Escapes a value for a double-quoted HTML attribute. `&` is escaped first,
 * so literal entity text in a value (`a&quot;b`) survives the browser's
 * decoding unchanged, then `"` so the value can't close the attribute.
 */
export function escapeAttribute(value: any): string {
	return (value ?? "").toString().replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}
