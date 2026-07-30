import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function BindCheckbox(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ agreed: false });

	/* User interface */
	t_body += `<label><input type="checkbox" value="${$state.agreed || false}"> I agree </label> <p>Agreed: ${t_fmt($state.agreed)}</p>`;

	return { body: t_body, head: t_head };
}
