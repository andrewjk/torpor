import $watch from "../../../../src/ssr/$serverWatch";
import t_class from "../../../../src/render/buildClasses";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ClassFalsy(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ a: true, b: false, c: 1, d: 0, e: "yes", f: "" });

	/* User interface */
	t_body += ` <p ${t_class({ a: $state.a, b: $state.b, c: $state.c, d: $state.d, e: $state.e, f: $state.f }) !== "" ? `class="${t_class({ a: $state.a, b: $state.b, c: $state.c, d: $state.d, e: $state.e, f: $state.f })}"` : ""}> Falsy values </p> `;

	return { body: t_body, head: t_head };
}
