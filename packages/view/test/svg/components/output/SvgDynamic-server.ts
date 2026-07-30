import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SvgDynamic(
	$props: { type: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<svg viewBox="0 0 100 100" role="img"><![>`;
	if ($props.type === "circle") {
		t_body += `<!^><circle cx="50" cy="50" r="40" fill="blue"></circle>`;
	}
	else if ($props.type === "rect") {
		t_body += `<!^><rect x="10" y="10" width="80" height="80" fill="green"></rect>`;
	}
	else {
		t_body += `<!^><polygon points="50,10 90,90 10,90" fill="red"></polygon>`;
	}
	t_body += `<!]><!></svg>`;

	return { body: t_body, head: t_head };
}
