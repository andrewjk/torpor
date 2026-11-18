import t_attr_if from "../../../../src/ssr/buildAttribute";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function ForOptionalChaining(
	$props: {
		items: { name: string; hasChildren?: boolean }[]
	},
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><li ${t_attr_if("data-testid", item?.name)} ${t_attr_if("data-selected", item?.hasChildren === true ? "" : undefined)} ${t_attr_if("data-fallback", "x" ?? item?.name)}> ${t_fmt(item?.name)} </li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
