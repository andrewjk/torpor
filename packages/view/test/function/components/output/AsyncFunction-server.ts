import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function AsyncFunctionTest(
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
	t_body += ` <button id="btn">Click</button> <p>Status: idle</p> `;

	async function fetchData() {
		window.__asyncResult = "fetched"
	};

	t_body += ` `;

	return { body: t_body, head: t_head };
}
