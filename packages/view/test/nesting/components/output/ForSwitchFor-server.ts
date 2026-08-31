import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForSwitchFor(
	$props: { matrix: number[][]; operation: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	for (let row of $props.matrix) {
		t_body += `<!^><div class="row"><![>`;
		switch ($props.operation) {
			case "sum": {
				t_body += `<!^><p>${t_fmt(row.reduce((a, b) => a + b, 0))}</p>`;
				break;
			}
			case "max": {
				t_body += `<!^><p>${t_fmt(Math.max(...row))}</p>`;
				break;
			}
			case "items": {
				t_body += `<!^><![>`;
				for (let cell of row) {
					t_body += `<!^><span>${t_fmt(cell)} </span>`;
				}
				t_body += `<!]><!>`;
				break;
			}
			default: {
				t_body += `<!^><p>Unknown op</p>`;
				break;
			}
		}
		t_body += `<!]><!> > </div>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
