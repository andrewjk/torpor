import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

function getContext(context: Record<PropertyKey, any> | undefined) {
	return context ?? {};
}

export default function Parent(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	$context = Object.assign({}, $context);
	let t_body = "";
	let t_head = "";

	$context["ParentContext"] = "hi from the parent";

	/* User interface */
	t_body += `<![>`;
	const t_comp_1 = Child(undefined, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}

function Child(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	$context = Object.assign({}, $context);
	let t_body = "";
	let t_head = "";

	// A bare `$context` read, e.g. passing the context object to a
	// helper function (as icon components do), without accessing a
	// property of it
	const context = getContext($context);

	/* User interface */
	t_body += `<p>Value: ${t_fmt(context["ParentContext"])}</p>`;

	return { body: t_body, head: t_head };
}
