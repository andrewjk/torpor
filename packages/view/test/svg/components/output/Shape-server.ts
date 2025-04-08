import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function Shape(
	$props: { name: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img"> <![>`;
	if ($props.name === "rect") {
		$output += ` <rect width="100" height="100" fill="red"></rect> `;
	}
	else {
		$output += ` <circle r="45" cx="50" cy="50" fill="red"></circle> `;
	}
	$output += `<!]><!> </svg>`;

	return $output;
}
