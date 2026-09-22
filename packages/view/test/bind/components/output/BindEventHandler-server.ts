import $watch from "../../../../src/ssr/$serverWatch";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function BindEventHandler(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ name: "Alice", typed: false });

	/* User interface */
	t_body += `<input value="${t_attr($state.name) || ""}"> <p>Hello, ${t_fmt($state.name)}</p> <![>`;
	if ($state.typed) {
		t_body += `<!^><p>Handler ran</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
