import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Named(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		_$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		// eslint-disable-next-line no-unused-vars
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += `<p> The article's body </p>`;
		return t_body;
	}
	t_slots_1["header"] = (
		_$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		// eslint-disable-next-line no-unused-vars
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += ` The article's header `;
		return t_body;
	}
	const t_comp_1 = Article(undefined, $context, t_slots_1);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}

function Article(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<section><h2><![>`;
	if ($slots && $slots["header"]) {
		t_body += $slots["header"](undefined, $context);
	}
	t_body += `<!]><!></h2> <![>`;
	if ($slots && $slots["_"]) {
		t_body += $slots["_"](undefined, $context);
	}
	t_body += `<!]><!> <![>`;
	if ($slots && $slots["footer"]) {
		t_body += $slots["footer"](undefined, $context);
	}
	t_body += `<!]><!></section>`;

	return { body: t_body, head: t_head };
}
