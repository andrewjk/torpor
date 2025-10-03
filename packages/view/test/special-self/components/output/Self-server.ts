import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Self(
	$props: { level: number },
	$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <p>Level ${t_fmt($props.level)}</p> <![>`;
	if ($props.level < 3) {
		t_body += `<!^> <![>`;
		const t_props_1: any = {};
		t_props_1["level"] = $props.level + 1;

		const t_comp_1 = Self(t_props_1, $context);
		t_body += t_comp_1.body;
		t_head += t_comp_1.head;
		t_body += `<!]><!> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
