import type EmbedStyle from "./EmbedStyle";

/**
 * The result of server-rendering an embed, matching the shape a torpor
 * server component returns: `body` is the HTML for the embed's target
 * element, `head` is anything the component rendered into `<head>` (place
 * it in the page head), and `styles` holds the embed's scoped styles --
 * inline them before the body HTML so server-rendered content isn't
 * unstyled until hydration (the client loader injects the same styles on
 * mount; pass `styles: false` when the server already inlined them).
 */
export default interface EmbedRenderResult {
	body: string;
	head: string;
	styles: EmbedStyle[];
}
