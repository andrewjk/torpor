import $watch from "../../../../src/ssr/$serverWatch";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function BindComponentOptional(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ user: undefined as { name: string } | undefined });

	/* User interface */
	t_body += `<![>`;
	const t_props_1 = {
		name: $state.user?.name,
	};
	const t_comp_1 = await BindText(t_props_1, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> <p>Hello, ${t_fmt($state.user?.name)}</p> <button>Set user</button>`;

	return { body: t_body, head: t_head };
}

async function BindText(
	$props: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<input value="${t_attr($props.name) || ""}">`;

	return { body: t_body, head: t_head };
}
