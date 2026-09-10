import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function ForIfLeadingContent(
	$props: { todos: Array<{ id: number, done: boolean }> },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let t of $props.todos) {
		t_body += `<!^><li>${t_fmt(t.id)}</li> <![>`;
		if (t.done) {
			t_body += `<!^><b class="mark">${t_fmt(t.id)}</b>`;
		}
		t_body += `<!]><!>`;
	}
	t_body += `<!]><!></ul> <footer>after</footer>`;

	return { body: t_body, head: t_head };
}
