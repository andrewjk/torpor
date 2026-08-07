import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SwitchInIf(
	$props: { items: string[]; toggle: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	if ($props.toggle) {
		t_body += `<!^><![>`;
		for (let item of $props.items) {
			t_body += `<!^><p>${t_fmt(item)}</p>`;
		}
		t_body += `<!]><!>`;
	}
	else {
		t_body += `<!^><p>Off</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
