import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function BigTitle(
	_$props: Record<PropertyKey, any>,
	$context: Record<PropertyKey, any>,
	$slots: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <h2> <![>`;
	if ($slots && $slots["_"]) {
		t_body += $slots["_"](undefined, $context);
	}
	t_body += `<!]><!> </h2> `;

	return { body: t_body, head: t_head };
}
