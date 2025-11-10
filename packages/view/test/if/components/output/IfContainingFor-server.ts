import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function IfContainingIf(
	$props: { condition: boolean, counter: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	if ($props.condition) {
		t_body += `<!^> <![>`;
		for (let i = 0; i < $props.counter; i++) {
			t_body += `<!^> <p>${t_fmt(i)}!</p> `;
		}
		t_body += `<!]><!> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
