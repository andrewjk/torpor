import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForContainingIf(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<section><![>`;
	for (let i = 0; i < 5; i++) {
		t_body += `<!^><button>do it ${t_fmt(i)}</button>`;

		function doit() {
			// it just needs to exist...
		};

	}
	t_body += `<!]><!></section>`;

	return { body: t_body, head: t_head };
}
