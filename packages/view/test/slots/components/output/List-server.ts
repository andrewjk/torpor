import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function List(
	$props: Record<PropertyKey, any>,
	$context: Record<PropertyKey, any>,
	$slots: Record<string, ServerSlotRender>
) {
	$props ??= {};
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <ul> <![>`;
	for (let item of $props.items) {
		t_body += `<!^> <li> <![>`;
		const t_sprops_1: any = {};
		t_sprops_1["item"] = item;
		if ($slots && $slots["_"]) {
			t_body += $slots["_"](t_sprops_1, $context);
		}
		t_body += `<!]><!> </li> `;
	}
	t_body += `<!]><!> </ul> `;

	return { body: t_body, head: t_head };
}
