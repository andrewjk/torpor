import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function CssStyle(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <h1 class="title torp-1ew8jkr">I am red</h1> <button style="font-size: 10rem;">I am a button</button> `;

	/* Style */
	t_head += "<style id='1ew8jkr'>.title.torp-1ew8jkr { color: red; } </style>";

	return { body: t_body, head: t_head };
}
