import t_attr_if from "../../../../src/ssr/buildAttribute";
import t_class from "../../../../src/ssr/buildClasses";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function AttributeValueSyntax(
	$props: { name: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div data-json="{&quot;a&quot;:1}" data-template="\x24{literal}" data-class="static {braces}" ${t_attr_if("title", `hello ${$props.name}`)} ${t_class($props.name)}></div>`;

	return { body: t_body, head: t_head };
}
