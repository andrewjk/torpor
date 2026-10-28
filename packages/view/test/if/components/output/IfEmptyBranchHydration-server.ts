import $watch from "../../../../src/ssr/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function IfEmptyBranchHydration(
	$props: { on?: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ on: $props.on ?? false, hasImage: false, hasLink: false });

	/* User interface */
	t_body += `<div class="sibling">sibling content</div> <![>`;
	if ($state.on) {
		t_body += `<!^0><div class="branch">branch content</div>`;
	}
	else {
		t_body += `<!^1><![>`;
		if ($state.hasImage) {
			t_body += `<!^0><div>image</div>`;
		}
		else if ($state.hasLink) {
			t_body += `<!^1><div>link</div>`;
		}
		t_body += `<!]><!>`;
	}
	t_body += `<!]><!> <button>toggle</button>`;

	return { body: t_body, head: t_head };
}
