import $async from "../../../../src/ssr/$serverAsync";
import $watch from "../../../../src/ssr/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function AwaitStale(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({
		version: 0,
		get data() {
			return $async(() => {
				// Read version synchronously so the computed tracks it and
				// re-fetches when it changes (reading inside setTimeout would
				// run in an untracked context).
				const version = $state.version;
				return new Promise((resolve) => {
					setTimeout(() => resolve("loaded v" + version), 10);
				});
			});
		},
	});

	function refresh() {
		$state.version++;
	}

	/* User interface */
	t_body += `<![>`;
	t_body += `<p>Loading...</p>`;
	t_body += `<!]><!> <button>refresh</button>`;

	return { body: t_body, head: t_head };
}
