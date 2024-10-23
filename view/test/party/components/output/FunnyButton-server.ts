import type { ServerSlotRender } from "@tera/view/ssr";

export default function FunnyButton(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	
	/* User interface */
	let $output = "";
	$output += `<button style="
	background: rgba(0, 0, 0, 0.4);
	color: #fff;
	padding: 10px 20px;
	font-size: 30px;
	border: 2px solid #fff;
	margin: 8px; transform: scale(0.9);
	box-shadow: 4px 4px rgba(0, 0, 0, 0.4);
	transition: transform 0.2s cubic-bezier(0.34, 1.65, 0.88, 0.925) 0s;
	outline: 0;
	"> <![>`;
	if ($slots && $slots["_"]) {
		$output += $slots["_"](undefined, $context);
	} else {
		$output += ` <span>No content found</span> `;
	}
	$output += `<!]><!> </button>`;
	
	return $output;
}

