import { $await } from "@torpor/view/ssr";
import { $pending } from "@torpor/view/ssr";
import { $refresh } from "@torpor/view/ssr";
import $watch from "../../../../src/ssr/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function RefreshSkeleton(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let fetchCount = 0;
	let $state = $watch({
		get data() {
			return $await(() => {
				const count = ++fetchCount;
				return new Promise((resolve) => {
					setTimeout(() => resolve("loaded #" + count), 10);
				});
			});
		},
	});

	function refresh() {
		$refresh(() => $state.data);
	}

	/* User interface */
	t_body += `<![>`;
	t_body += `<p class="skeleton">Loading...</p>`;
	t_body += `<!]><!> <button>refresh</button>`;

	return { body: t_body, head: t_head };
}
