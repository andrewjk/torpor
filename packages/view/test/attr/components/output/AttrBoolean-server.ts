import t_attr_if from "../../../../src/ssr/buildAttribute";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function AttrBoolean(
	$props: { disabled: boolean; checked: boolean; readonly: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<button ${t_attr_if("disabled", $props.disabled)}>Click</button> <input type="checkbox" ${t_attr_if("checked", $props.checked)}> <input type="text" ${t_attr_if("readonly", $props.readonly)}>`;

	return { body: t_body, head: t_head };
}
