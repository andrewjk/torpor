import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import UserProfile from "../output/./UserProfile-server";

export default function UserProfileApp(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <![>`;
	const t_props_1: any = {};
	t_props_1["name"] = "John";
	t_props_1["age"] = 20;
	t_props_1["favouriteColors"] = ["green", "blue", "red"];
	t_props_1["isAvailable"] = true;

	const t_comp_1 = UserProfile(t_props_1, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
