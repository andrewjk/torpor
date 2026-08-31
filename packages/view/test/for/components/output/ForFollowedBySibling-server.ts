import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForFollowedByIf(
	$props: { items: string[], show: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><li>${t_fmt(item)}</li>`;
	}
	t_body += `<!]><!></ul> <![>`;
	if ($props.show) {
		t_body += `<!^><p>after</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
