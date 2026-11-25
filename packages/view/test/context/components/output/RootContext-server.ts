import t_fmt from "../../../../src/ssr/formatText";
import { renderContext as t_render_context } from "../../../../src/ssr/renderContext";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

async function Child(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	$context = Object.assign({}, $context);
	let t_body = "";
	let t_head = "";

	// Destructuring keeps the object, so reads through it stay reactive
	let { $app } = $context;

	/* User interface */
	t_body += `<p>${t_fmt($app.name)} / ${t_fmt($context.$app.count)}</p>`;

	return { body: t_body, head: t_head };
}

export default async function RootContext(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	$context = t_render_context($context);
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<section><![>`;
	const t_comp_1 = await Child(undefined, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!></section>`;

	return { body: t_body, head: t_head };
}
