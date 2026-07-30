import t_attr from "../../../../src/render/formatAttributeText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function AttrDynamic(
	$props: { id: string; title: string; dataValue: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div ${$props.id ? `id="${t_attr($props.id)}"` : ""} ${$props.title ? `title="${t_attr($props.title)}"` : ""} ${$props.dataValue ? `data-value="${t_attr($props.dataValue)}"` : ""}> Content </div>`;

	return { body: t_body, head: t_head };
}
