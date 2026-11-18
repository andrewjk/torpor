import t_attr_if from "../../../../src/ssr/buildAttribute";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function TernaryServer(
	$props: { on: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<button role="radio" ${t_attr_if("tabindex", $props.on ? 0 : -1)} ${t_attr_if("aria-checked", $props.on ? "true" : "false")} ${t_attr_if("data-state", $props.on ? "active" : "inactive")}>Hello</button>`;

	return { body: t_body, head: t_head };
}
