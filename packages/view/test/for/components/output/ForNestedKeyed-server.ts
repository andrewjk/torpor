import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForNestedKeyed(
	$props: {
		groups: Array<{ id: string, items: Array<{ id: number, label: string }> }>,
	},
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div><![>`;
	for (let g of $props.groups) {
		t_body += `<!^><section><h2>${t_fmt(g.id)}</h2> <ul><![>`;
		for (let it of g.items) {
			t_body += `<!^><li>${t_fmt(it.label)}</li>`;
		}
		t_body += `<!]><!></ul></section>`;
	}
	t_body += `<!]><!></div> <footer>after</footer>`;

	return { body: t_body, head: t_head };
}
