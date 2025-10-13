import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function ChildA(
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	$context = Object.assign({}, $context);
	let t_body = "";
	let t_head = "";

	$context["ChildAContext"] = "hi!";

	/* User interface */
	t_body += ` <p>Parent: ${t_fmt($context["ParentContext"])}</p> <p>Child a: ${t_fmt($context["ChildAContext"])}</p> <p>Child b: ${t_fmt($context["ChildBContext"] ?? "???")}</p> `;

	return { body: t_body, head: t_head };
}
