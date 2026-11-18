import t_attr_if from "../../../../src/ssr/buildAttribute";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function TextareaValue(
	$props: { value: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<textarea ${t_attr_if("value", $props.value)}></textarea>`;

	return { body: t_body, head: t_head };
}
