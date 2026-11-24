import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function RawTextElements(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<script>const a = { b: 1 };\nconst s = \x60\x24{a.b}\x60;\nconst p = "C:\\\\temp";</script> <style>@media (min-width: 1px) {\n\x20\x20p {\n\x20\x20\x20\x20color: red;\n\x20\x20}\n}</style>`;

	return { body: t_body, head: t_head };
}
