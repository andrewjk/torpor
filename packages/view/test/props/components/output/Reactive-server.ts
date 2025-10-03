import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Reactive(
	$props: any,
	$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ text: "before" })

	/* User interface */
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
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <p> ${t_fmt($props.text)} </p> `;

	return { body: t_body, head: t_head };
}
