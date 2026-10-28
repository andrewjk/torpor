import t_attr from "../../../../src/render/formatAttributeText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function IfHydrationBranchMismatch(
	$props: { on: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<span class="badge" ${($props.on) ? `data-on="${t_attr($props.on)}"` : ""}><![>`;
	if ($props.on) {
		t_body += `<!^0><span class="icon minus">minus</span>`;
	}
	else {
		t_body += `<!^1><span class="icon plus">plus</span>`;
	}
	t_body += `<!]><!></span>`;

	return { body: t_body, head: t_head };
}
