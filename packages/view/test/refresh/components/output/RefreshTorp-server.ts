import $async from "../../../../src/ssr/$serverAsync";
import $pending from "../../../../src/ssr/$serverPending";
import $refresh from "../../../../src/ssr/$serverRefresh";
import $watch from "../../../../src/ssr/$serverWatch";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SelfDisablingRefresh(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let fetchCount = 0;
	let $state = $watch({
		get users() {
			return $async(() => {
				const count = ++fetchCount;
				return new Promise((resolve) => {
					setTimeout(() => resolve("users #" + count), 10);
				});
			});
		},
	});

	/* User interface */
	t_body += `<p>Users: ${t_fmt($state.users)}</p> <button ${$pending(() => $state.users) ? `disabled="${t_attr($pending(() => $state.users))}"` : ""}> refresh </button>`;

	return { body: t_body, head: t_head };
}
