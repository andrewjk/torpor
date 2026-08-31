import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForAwaitReactive(
	$props: { ids: number[]; loaded: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let id of $props.ids) {
		t_body += `<!^><![>`;
		t_body += `<li class="loading">${t_fmt(id)} loading</li>`;
		t_body += `<!]><!>`;
	}
	t_body += `<!]><!></ul> <footer>after</footer>`;

	return { body: t_body, head: t_head };
}
