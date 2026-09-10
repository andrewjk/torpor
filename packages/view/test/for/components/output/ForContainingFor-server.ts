import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function ForContainingFor(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<section><![>`;
	for (let i = 0; i < 5; i++) {
		t_body += `<!^><![>`;
		for (let j = 0; j < 2; j++) {
			t_body += `<!^><p> ${t_fmt(i)}-${t_fmt(j)} </p>`;
		}
		t_body += `<!]><!>`;
	}
	t_body += `<!]><!></section>`;

	return { body: t_body, head: t_head };
}
