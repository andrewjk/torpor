import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function IsAvailable(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({
		isAvailable: false
	});

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <div>${t_fmt($state.isAvailable ? "Available" : "Not available")}</div> <input id="is-available" type="checkbox" checked="${$state.isAvailable || false}"> <label for="is-available">Is available</label> `;

	return { body: t_body, head: t_head };
}
