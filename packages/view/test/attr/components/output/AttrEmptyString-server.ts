import t_attr_if from "../../../../src/ssr/buildAttribute";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function AttrEmptyString(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<img src="x.png" alt="" data-testid="static"> <img src="x.png" ${t_attr_if("alt", "")} data-testid="dynamic">`;

	return { body: t_body, head: t_head };
}
