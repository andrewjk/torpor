import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function IfSingleIf(
	$props: { outer: boolean, inner: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div><![>`;
	if ($props.outer) {
		t_body += `<!^><![>`;
		if ($props.inner) {
			t_body += `<!^><p>both</p>`;
		}
		t_body += `<!]><!>`;
	}
	t_body += `<!]><!></div> <footer>after</footer>`;

	return { body: t_body, head: t_head };
}
