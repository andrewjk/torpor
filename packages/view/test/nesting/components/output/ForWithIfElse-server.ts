import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForWithIfElse(
	$props: { tabs: string[]; activeTab: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <nav> <![>`;
	for (let tab of $props.tabs) {
		t_body += `<!^> <![>`;
		if (tab === $props.activeTab) {
			t_body += `<!^> <button class="active">${t_fmt(tab)}</button> `;
		}
		else {
			t_body += `<!^> <button>${t_fmt(tab)}</button> `;
		}
		t_body += `<!]><!> `;
	}
	t_body += `<!]><!> </nav> <p>Active: ${t_fmt($props.activeTab)}</p> `;

	return { body: t_body, head: t_head };
}
