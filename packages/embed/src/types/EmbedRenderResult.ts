/**
 * The result of server-rendering an embed, matching the shape a torpor
 * server component returns: `body` is the HTML for the embed's target
 * element, `head` is anything the component rendered into `<head>`.
 */
export default interface EmbedRenderResult {
	body: string;
	head: string;
}
