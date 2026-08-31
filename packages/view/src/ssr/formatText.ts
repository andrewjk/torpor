import formatText from "../render/formatText";

const ESCAPABLE: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
};

/**
 * Formats a text value for inclusion in server-rendered HTML.
 *
 * Unlike the client version (which assigns to `textContent` and so needs no
 * escaping), the server interpolates values into an HTML string, so the
 * characters that would otherwise be parsed as markup are escaped here.
 */
export default function formatServerText(value: any): string {
	return formatText(value).replace(/[&<>]/g, (c) => ESCAPABLE[c]);
}
