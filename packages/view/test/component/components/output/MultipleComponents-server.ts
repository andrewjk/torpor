import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function MultiComponent(
	$props: { label: string },
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ count: 1 });

	/* User interface */
	t_body += `<div><p>outer ${t_fmt($state.count)}</p> <![>`;
	const t_props_1 = {
		label: $props.label,
	};
	const t_comp_1 = Inner(t_props_1, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!></div>`;

	return { body: t_body, head: t_head };
}

interface InnerProps {
	label: string;
}

/**
 * The inner component, in the same file.
 */
function Inner(
	$props: InnerProps,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<span>inner ${t_fmt($props.label)}</span>`;

	return { body: t_body, head: t_head };
}
