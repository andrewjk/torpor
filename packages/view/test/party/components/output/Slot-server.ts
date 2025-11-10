import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function FunnyButtonApp(
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

	const t_comp_1 = FunnyButton(undefined, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> <![>`;
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += `Click me!`;
		return t_body;
	}

	const t_comp_2 = FunnyButton(undefined, $context, t_slots_1);
	t_body += t_comp_2.body;
	t_head += t_comp_2.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}

function FunnyButton(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <button style="
				background: rgba(0, 0, 0, 0.4);
				color: #fff;
				padding: 10px 20px;
				font-size: 30px;
				border: 2px solid #fff;
				margin: 8px; transform: scale(0.9);
				box-shadow: 4px 4px rgba(0, 0, 0, 0.4);
				transition: transform 0.2s cubic-bezier(0.34, 1.65, 0.88, 0.925) 0s;
				outline: 0;
			"> <![>`;
	if ($slots && $slots["_"]) {
		t_body += $slots["_"](undefined, $context);
	} else {
		t_body += ` <span>No content found</span> `;
	}
	t_body += `<!]><!> </button> `;

	return { body: t_body, head: t_head };
}
