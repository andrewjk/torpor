import t_attr_if from "../../../../src/ssr/buildAttribute";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function ForRegex(
	$props: { items: string[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><li ${t_attr_if("data-testid", item)} ${t_attr_if("data-starts-a", /^a/.test(item) ? "" : undefined)} ${t_attr_if("data-label", item.replace(/\b[a-z]/g, (c) => c.toUpperCase()))}> ${t_fmt(item.replace(/\d+/g, ""))} </li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
