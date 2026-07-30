import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SpecialElementAttrs(
	$props: { tag: string; content: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<${$props.tag} id="dynamic" class="custom" data-value="test"> ${t_fmt($props.content)} </${$props.tag}>`;

	return { body: t_body, head: t_head };
}
