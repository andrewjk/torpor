import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/render/formatText";
import { t_spread } from "@torpor/view/ssr";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SpreadElement(
	$props: { items: { attrs: Record<string, any> }[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({
		attrs: {
			"data-one": "1",
			title: "hello",
			disabled: false,
			onclick: () => {
				$state.clicks = $state.clicks + 1;
			},
		} as Record<string, any>,
		clicks: 0,
	})

	/* User interface */
	t_body += `<div data-testid="target" ${t_spread($state.attrs)}><p>Content</p></div> <span data-testid="clicks">${t_fmt($state.clicks)}</span> <button data-testid="swap"> Swap </button> <ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><li ${t_spread(item.attrs)}>${t_fmt(item.attrs["data-name"])}</li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
