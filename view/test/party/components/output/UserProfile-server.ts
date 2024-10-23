import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function UserProfile(
	$props: {
		name: string,
		age: number,
		favoriteColors: string[],
		isAvailable: boolean
	},
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	let $output = "";
	$output += `<div> <p>My name is ${t_fmt($props.name)}!</p> <p>My age is ${t_fmt($props.age)}!</p> <p>My favourite colors are ${t_fmt($props.favouriteColors.join(", "))}!</p> <p>I am ${t_fmt($props.isAvailable ? "available" : "not available")}</p> </div>`;
	
	return $output;
}

