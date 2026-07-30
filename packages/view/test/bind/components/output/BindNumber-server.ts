import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function NumberInput(
	$props: { value: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<input type="number" value="${$props.value || 0}"> <p>Value: ${t_fmt($props.value)}</p>`;

	return { body: t_body, head: t_head };
}
