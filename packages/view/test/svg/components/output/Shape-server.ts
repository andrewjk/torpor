import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_class from "../../../../src/render/buildClasses";

export default function Shape(
	$props: { name: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <svg class="${t_class({ "svg-cls": true })}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img"> <![>`;
	if ($props.name === "rect") {
		t_body += `<!^> <rect width="100" height="100" fill="red"></rect> `;
	}
	else {
		t_body += `<!^> <circle r="45" cx="50" cy="50" fill="red"></circle> `;
	}
	t_body += `<!]><!> </svg> `;

	return { body: t_body, head: t_head };
}
