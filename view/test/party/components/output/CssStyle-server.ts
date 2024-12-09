import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function CssStyle(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<div> <h1 class="title tera-1ew8jkr">I am red</h1> <button style="font-size: 10rem;">I am a button</button> </div>`;

	return $output;
}
