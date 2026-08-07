import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function IfContainingIf(
	$props: { condition: boolean, counter: number },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	if ($props.condition) {
		t_body += `<!^><button>do it</button>`;

		function doit() {
			// it just needs to exist...
		};

	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
