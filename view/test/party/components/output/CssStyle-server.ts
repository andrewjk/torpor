import type { ServerSlotRender } from "@tera/view";

export default function CssStyle(
	$props: { counter: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> <h1 class="title tera-1ew8jkr">I am red</h1> <button style="font-size: 10rem;">I am a button</button> </div>`;
	return $output;


}

