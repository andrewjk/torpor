import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function NestedComponent(
	$props: { parentName: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<h1>${t_fmt($props.parentName)}</h1> <![>`;
	const t_props_1 = {
		name: $props.parentName,
	};
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		// @ts-ignore
		$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += `<![>`;
		const t_props_2 = {
			name: $props.parentName,
		};
		const t_comp_1 = Child(t_props_2, $context);
		t_body += t_comp_1.body;
		t_head += t_comp_1.head;
		t_body += `<!]><!>`;
		return t_body;
	}
	const t_comp_2 = Parent(t_props_1, $context, t_slots_1);
	t_body += t_comp_2.body;
	t_head += t_comp_2.head;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}

function Parent(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div><p>Parent: ${t_fmt($props.name)}</p> <![>`;
	if ($slots && $slots["_"]) {
		t_body += $slots["_"](undefined, $context);
	}
	t_body += `<!]><!></div>`;

	return { body: t_body, head: t_head };
}

function Child(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<p>Child: ${t_fmt($props.name)}</p>`;

	return { body: t_body, head: t_head };
}
