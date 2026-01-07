import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function UserProfileApp(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	const t_props_1 = {
		name: "John",
		age: 20,
		favoriteColors: ["green", "blue", "red"],
		isAvailable: true,
	};
	const t_comp_1 = UserProfile(t_props_1, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}

function UserProfile(
	$props: {
		name: string,
		age: number,
		favoriteColors: string[],
		isAvailable: boolean
	},
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <p>My name is ${t_fmt($props.name)}!</p> <p>My age is ${t_fmt($props.age)}!</p> <p>My favourite colors are ${t_fmt($props.favoriteColors.join(", "))}!</p> <p>I am ${t_fmt($props.isAvailable ? "available" : "not available")}</p> `;

	return { body: t_body, head: t_head };
}
