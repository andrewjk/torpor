import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function SmallTitle(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <h6> <![>`;
	if ($slots && $slots["_"]) {
		t_body += $slots["_"](undefined, $context);
	}
	t_body += `<!]><!> </h6> `;

	return { body: t_body, head: t_head };
}
