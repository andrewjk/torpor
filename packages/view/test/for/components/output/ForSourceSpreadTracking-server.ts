import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Component(
	$props: { filter: string, rows: { n: number }[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	function filtered() {
		const all = [...$props.rows];
		return $props.filter === "even" ? all.filter((r) => r.n % 2 === 0) : all;
	}

	/* User interface */
	t_body += `<ul><![>`;
	for (let row of filtered()) {
		t_body += `<!^><li>${t_fmt(row.n)}</li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
