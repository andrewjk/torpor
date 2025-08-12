import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function Article(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <section> <h2> <![>`;
	if ($slots && $slots["header"]) {
		t_body += $slots["header"](undefined, $context);
	}
	t_body += `<!]><!> </h2> <![>`;
	if ($slots && $slots["_"]) {
		t_body += $slots["_"](undefined, $context);
	}
	t_body += `<!]><!> <![>`;
	if ($slots && $slots["footer"]) {
		t_body += $slots["footer"](undefined, $context);
	}
	t_body += `<!]><!> </section> `;

	return { body: t_body, head: t_head };
}
