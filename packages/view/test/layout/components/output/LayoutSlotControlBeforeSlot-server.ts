import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Page(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ count: 0 });

	/* User interface */
	t_body += `<h1>Home</h1> <button>Count ${t_fmt($state.count)}</button>`;

	return { body: t_body, head: t_head };
}
