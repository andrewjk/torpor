import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Unused(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;

	const t_comp_1 = Header(undefined, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}

function Header(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <h2> <![>`;
	if ($slots && $slots["_"]) {
		t_body += $slots["_"](undefined, $context);
	} else {
		t_body += ` Default header... `;
	}
	t_body += `<!]><!> </h2> `;

	return { body: t_body, head: t_head };
}
