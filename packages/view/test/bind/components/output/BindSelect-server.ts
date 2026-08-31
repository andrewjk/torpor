import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SelectBind(
	$props: { value: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<select value="${t_attr($props.value) || ""}"><option value="a">Option A</option><option value="b">Option B</option><option value="c">Option C</option></select> <p>Selected: ${t_fmt($props.value)}</p>`;

	return { body: t_body, head: t_head };
}
