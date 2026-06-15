import $cache from "../../../../src/ssr/$serverCache";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ComputedCache(
	$props: { value: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <p>Squared: ${t_fmt(squared)}</p> <p>Cubed: ${t_fmt(cubed)}</p> `;
	get squared(): number {
		return $cache(() => $props.value * $props.value)
	}

	get cubed(): number {
		return $cache(() => squared * $props.value)
	}
	return { body: t_body, head: t_head };
}
