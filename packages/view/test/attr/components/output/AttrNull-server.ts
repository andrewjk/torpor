import t_attr_if from "../../../../src/ssr/buildAttribute";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function AttrNull(
	$props: { title: string | null; label: string | undefined; count: number | null },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div ${t_attr_if("title", $props.title)} ${t_attr_if("aria-label", $props.label)} ${t_attr_if("data-count", $props.count)}> Content </div>`;

	return { body: t_body, head: t_head };
}
