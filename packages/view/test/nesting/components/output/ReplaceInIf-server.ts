import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ReplaceInIf(
	$props: { counter: number; show: boolean },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	if ($props.show) {
		t_body += `<!^> <![>`;
		$props.counter;
		t_body += ` <p>Replaced: ${t_fmt($props.counter)}</p> `;
		t_body += `<!]><!> `;
	}
	else {
		t_body += `<!^> <p>Hidden</p> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
