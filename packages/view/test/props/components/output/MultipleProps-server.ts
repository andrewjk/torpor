import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function MultipleProps(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	const t_props_1 = {
		title: "My Card",
		subtitle: "A subtitle",
		count: 42,
		active: true,
	};
	const t_comp_1 = Card(t_props_1, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}

function Card(
	$props: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div><h2>${t_fmt($props.title)}</h2> <h3>${t_fmt($props.subtitle)}</h3> <p>Count: ${t_fmt($props.count)}</p> <![>`;
	if ($props.active) {
		t_body += `<!^><span>Active</span>`;
	}
	else {
		t_body += `<!^><span>Inactive</span>`;
	}
	t_body += `<!]><!></div>`;

	return { body: t_body, head: t_head };
}
