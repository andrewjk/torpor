import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SlotReactive(
	$props: { label: string },
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		_$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		// eslint-disable-next-line no-unused-vars
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += `<p>${t_fmt($props.label)}</p>`;
		return t_body;
	}
	const t_comp_1 = Labeled(undefined, $context, t_slots_1);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}

function Labeled(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div><strong>Label:</strong> <![>`;
	if ($slots && $slots["_"]) {
		t_body += $slots["_"](undefined, $context);
	}
	t_body += `<!]><!></div>`;

	return { body: t_body, head: t_head };
}
