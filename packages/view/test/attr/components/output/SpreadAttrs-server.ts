import t_attr_if from "../../../../src/ssr/buildAttribute";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function SpreadAttrs(
	$props: { collapsed: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div ${t_attr_if("aria-expanded", $props.collapsed ? "false" : "true")} ${t_attr_if("data-state", $props.collapsed ? "collapsed" : "expanded")}><p>Content</p></div>`;

	return { body: t_body, head: t_head };
}
