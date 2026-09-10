import t_style from "../../../../src/render/buildStyles";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function StyleKebab(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div ${t_style({ marginLeft: "10px", marginRight: "20px", backgroundColor: "green" }) !== "" ? `style="${t_style({ marginLeft: "10px", marginRight: "20px", backgroundColor: "green" })}"` : ""}> Kebab case </div>`;

	return { body: t_body, head: t_head };
}
