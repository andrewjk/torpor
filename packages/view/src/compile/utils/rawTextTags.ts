/**
 * HTML raw-text elements. Their contents aren't parsed as markup (or as a
 * torpor template): braces, `@` and `<` are all literal, and the browser
 * doesn't decode character references inside them either. Rendered `<script>`
 * / `<style>` content is therefore emitted exactly as written.
 */
const RAW_TEXT_TAGS = new Set(["script", "style", "xmp", "iframe", "noembed", "noframes"]);

export default function isRawTextTag(tagName: string): boolean {
	return RAW_TEXT_TAGS.has(tagName.toLowerCase());
}
