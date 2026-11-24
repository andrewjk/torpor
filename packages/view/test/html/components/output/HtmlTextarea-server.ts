import $watch from "../../../../src/ssr/$serverWatch";
import t_attr from "../../../../src/render/formatAttributeText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function HtmlTextarea(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let $state = $watch({
		text: "first",
		get output() {
			return "<h1>" + $state.text + "</h1>\n<p>End of " + $state.text + "</p>";
		},
	});

	/* User interface */
	t_body += `<div class="card"><textarea value="${t_attr($state.text) || ""}"></textarea> <div class="output"><![>${$state.output}<!]><!></div></div>`;

	return { body: t_body, head: t_head };
}
