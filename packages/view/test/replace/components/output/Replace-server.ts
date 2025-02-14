import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Replace(
	$props: { name: string},
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let counter = 0;

	/* User interface */
	let $output = "";
	$output += `<div> <![>`;
	$props.name;
	$output += ` <p>The replace count is ${t_fmt(counter++)}.</p> `;
	$output += `<!]><!> </div>`;

	return $output;
}
