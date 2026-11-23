import t_attr_if from "../../../../src/ssr/buildAttribute";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Component(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	const t_props_1 = {
		"aria-hidden": "true",
	};
	const t_comp_1 = await Icon(t_props_1, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}

async function Icon(
	$props: { "aria-hidden": string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<i ${t_attr_if("aria-hidden", $props["aria-hidden"])}>i</i>`;

	return { body: t_body, head: t_head };
}
