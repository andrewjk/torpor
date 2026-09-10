import t_class from "../../../../src/render/buildClasses";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function ClassFalsy(
	$props: { a: boolean; b: boolean; c: number; d: number; e: string; f: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<p ${t_class({ a: $props.a, b: $props.b, c: $props.c, d: $props.d, e: $props.e, f: $props.f }) !== "" ? `class="${t_class({ a: $props.a, b: $props.b, c: $props.c, d: $props.d, e: $props.e, f: $props.f })}"` : ""}> Falsy values </p>`;

	return { body: t_body, head: t_head };
}
