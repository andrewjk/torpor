import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function MultiSelectBind(
	$props: { values: string[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<select multiple><option value="a">A</option><option value="b">B</option><option value="c">C</option></select>`;

	return { body: t_body, head: t_head };
}
