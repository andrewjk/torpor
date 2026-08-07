import t_style from "../../../../src/render/buildStyles";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function StyleCustomProp(
	$props: { styleVar: string; customProp: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div ${t_style({ "--my-color": $props.styleVar, color: "var(--my-color)" }) !== "" ? `style="${t_style({ "--my-color": $props.styleVar, color: "var(--my-color)" })}"` : ""}> Colored text </div>`;

	return { body: t_body, head: t_head };
}
