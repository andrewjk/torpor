import $watch from "../../../../src/ssr/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function AwaitResolved(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({
		data: Promise.resolve("loaded data")
	});

	/* User interface */
	t_body += `<![>`;
	t_body += `<p>Loading...</p>`;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
