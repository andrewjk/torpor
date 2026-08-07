import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function IfContainingFor(
	$props: { show: boolean; items: string[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	if ($props.show) {
		t_body += `<!^><ul><![>`;
		for (let item of $props.items) {
			t_body += `<!^><li>${t_fmt(item)}</li>`;
		}
		t_body += `<!]><!></ul>`;
	}
	else {
		t_body += `<!^><p>Nothing to show</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
