import $watch from "../../../../src/ssr/$serverWatch";
import t_class from "../../../../src/render/buildClasses";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ClassString(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ size: "large", color: "red" });

	/* User interface */
	t_body += ` <p ${t_class("box " + $state.size + " " + $state.color) !== "" ? `class="${t_class("box " + $state.size + " " + $state.color)}"` : ""}> Concatenated </p> <p ${t_class(["tag", $state.size, $state.color].join(" ")) !== "" ? `class="${t_class(["tag", $state.size, $state.color].join(" "))}"` : ""}> Joined </p> `;

	return { body: t_body, head: t_head };
}
