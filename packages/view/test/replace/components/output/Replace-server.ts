import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Replace(
	$props: { name: string},
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};
	let t_body = "";
	let t_head = "";
	let counter = 0;

	/* User interface */
	t_body += ` <![>`;
	$props.name;
	t_body += ` <p>The replace count is ${t_fmt(counter++)}.</p> `;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
