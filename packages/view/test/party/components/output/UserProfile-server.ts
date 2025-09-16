import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function UserProfile(
	$props: {
		name: string,
		age: number,
		favoriteColors: string[],
		isAvailable: boolean
	},
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <p>My name is ${t_fmt($props.name)}!</p> <p>My age is ${t_fmt($props.age)}!</p> <p>My favourite colors are ${t_fmt($props.favouriteColors.join(", "))}!</p> <p>I am ${t_fmt($props.isAvailable ? "available" : "not available")}</p> `;

	return { body: t_body, head: t_head };
}
