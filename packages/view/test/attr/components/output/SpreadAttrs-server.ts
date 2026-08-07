import t_attr from "../../../../src/render/formatAttributeText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SpreadAttrs(
	$props: { collapsed: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div ${$props.collapsed ? "false" : "true" ? `aria-expanded="${t_attr($props.collapsed ? "false" : "true")}"` : ""} ${$props.collapsed ? "collapsed" : "expanded" ? `data-state="${t_attr($props.collapsed ? "collapsed" : "expanded")}"` : ""}><p>Content</p></div>`;

	return { body: t_body, head: t_head };
}
