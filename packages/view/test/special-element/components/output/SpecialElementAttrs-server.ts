import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function SpecialElementAttrs(
	$props: { tag: string; content: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<${$props.tag} id="dynamic" class="custom" data-value="test"> ${t_fmt($props.content)} </${$props.tag}>`;

	return { body: t_body, head: t_head };
}
