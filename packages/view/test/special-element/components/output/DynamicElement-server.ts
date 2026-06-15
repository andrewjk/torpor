import t_attr from "../../../../src/render/formatAttributeText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function DynamicTagWithAttr(
	$props: { tag: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <${$props.tag} id="target" ${$props.tag ? `data-role="${t_attr($props.tag)}"` : ""}> Content </${$props.tag}> `;

	return { body: t_body, head: t_head };
}
