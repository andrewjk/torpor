import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function ForContainingIf(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <section> <![>`;
	for (let i = 0; i < 5; i++) {
		t_body += `<!^> <button>do it ${t_fmt(i)}</button> `;

		function doit() {
			// it just needs to exist...
		};

		t_body += ` `;
	}
	t_body += `<!]><!> </section> `;

	return { body: t_body, head: t_head };
}
