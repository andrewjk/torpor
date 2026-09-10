import t_attr from "../../../../src/render/formatAttributeText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function AttrBoolean(
	$props: { disabled: boolean; checked: boolean; readonly: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<button ${$props.disabled ? `disabled="${t_attr($props.disabled)}"` : ""}>Click</button> <input type="checkbox" ${$props.checked ? `checked="${t_attr($props.checked)}"` : ""}> <input type="text" ${$props.readonly ? `readonly="${t_attr($props.readonly)}"` : ""}>`;

	return { body: t_body, head: t_head };
}
