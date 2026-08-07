import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SwitchComponent(
	$props: { mode: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	switch ($props.mode) {
		case "a": {
			t_body += `<!^><div id="a">Mode A</div>`;
			break;
		}
		case "b": {
			t_body += `<!^><div id="b">Mode B</div>`;
			break;
		}
		default: {
			t_body += `<!^><div id="default">Default</div>`;
			break;
		}
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
