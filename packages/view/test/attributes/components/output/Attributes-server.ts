import t_attr_if from "../../../../src/ssr/buildAttribute";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Attributes(
	$props: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div ${t_attr_if("thing", $props.thing)} ${t_attr_if("data-thing", $props.dataThing)} ${t_attr_if("caption", `this attribute is for ${$props.description}`)} ${t_attr_if("attr", $props.attr)}> Hello! </div>`;

	return { body: t_body, head: t_head };
}
