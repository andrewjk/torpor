import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Component(
	$props: { item: { name: string } | undefined },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	if ($props.item) {
		t_body += `<!^0><p>${t_fmt($props.item!.name)}</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
