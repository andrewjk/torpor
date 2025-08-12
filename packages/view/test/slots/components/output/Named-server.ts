import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import Article from "../output/./Article-server"

export default function Named(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <![>`;
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += `  <p> The article's body </p> `;
		return t_body;
	}
	t_slots_1["header"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += ` The article's header `;
		return t_body;
	}

	const t_comp_1 = Article(undefined, $context, t_slots_1);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
