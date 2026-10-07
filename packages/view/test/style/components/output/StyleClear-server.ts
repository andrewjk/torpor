import t_attr from "../../../../src/render/formatAttributeText";
import t_style from "../../../../src/render/buildStyles";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function StyleClear(
	$props: { hidden: boolean; color: string | undefined },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div class="object" ${t_style({ display: $props.hidden ? "none" : undefined }) !== "" ? `style="${t_style({ display: $props.hidden ? "none" : undefined })}"` : ""}>Object</div> <div class="string" style="color: ${t_attr($props.color)}">String</div>`;

	return { body: t_body, head: t_head };
}
