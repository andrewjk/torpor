import t_attr_if from "../../../../src/ssr/buildAttribute";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function AttrDynamic(
	$props: { id: string; title: string; dataValue: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div ${t_attr_if("id", $props.id)} ${t_attr_if("title", $props.title)} ${t_attr_if("data-value", $props.dataValue)}> Content </div>`;

	return { body: t_body, head: t_head };
}
