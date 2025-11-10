import $watch from "../../../../src/ssr/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";

export default function BindComponent(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ name: "Alice", selected: 1 });

	/* User interface */
	t_body += ` <![>`;
	const t_props_1: any = {};
	t_props_1["&name"] = $state.name;

	const t_comp_1 = BindText(t_props_1, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> <p>Hello, ${t_fmt($state.name)}</p> `;

	return { body: t_body, head: t_head };
}

function BindText(
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <input value="${t_attr($props.name) || ""}"> `;

	return { body: t_body, head: t_head };
}
