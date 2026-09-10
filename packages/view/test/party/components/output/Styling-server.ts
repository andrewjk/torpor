import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function CssStyle(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<h1 class="title torp-1ew8jkr">I am red</h1> <button style="font-size: 160px;">I am a button</button>`;

	/* Style */
	t_head += "<style id='1ew8jkr'>.title.torp-1ew8jkr { color: red; } </style>";

	return { body: t_body, head: t_head };
}
