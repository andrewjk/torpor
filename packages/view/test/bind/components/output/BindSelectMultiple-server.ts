import t_attr from "../../../../src/render/formatAttributeText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function MultiSelectBind(
	$props: { values: string[] },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <select multiple value="${t_attr($props.values) || ""}"> <option value="a">A</option> <option value="b">B</option> <option value="c">C</option> </select> `;

	return { body: t_body, head: t_head };
}
