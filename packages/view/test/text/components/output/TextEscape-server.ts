import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function TextEscape(
	$props: { code: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<pre><code>${t_fmt($props.code)}</code></pre> <p id="lit">${t_fmt("<b>bold</b>")}</p>`;

	return { body: t_body, head: t_head };
}
