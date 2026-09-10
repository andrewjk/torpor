import t_attr from "../../../../src/render/formatAttributeText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function AttrNull(
	$props: { title: string | null; label: string | undefined; count: number | null },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div ${$props.title ? `title="${t_attr($props.title)}"` : ""} ${$props.label ? `aria-label="${t_attr($props.label)}"` : ""} ${$props.count ? `data-count="${t_attr($props.count)}"` : ""}> Content </div>`;

	return { body: t_body, head: t_head };
}
