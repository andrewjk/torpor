import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Reactive(
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({ text: "before" })

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <button>Update text</button> <![>`;
	const t_props_1: any = {};
	t_props_1["text"] = $state.text;

	const t_comp_1 = Child(t_props_1, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}

function Child(
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <p> ${t_fmt($props.text)} </p> `;

	return { body: t_body, head: t_head };
}
