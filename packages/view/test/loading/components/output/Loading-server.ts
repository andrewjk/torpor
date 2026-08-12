import { $await } from "@torpor/view/ssr";
import $watch from "../../../../src/ssr/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function LoadingTest(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({
		version: 0,
		get data() {
			return $await(
				() =>
				new Promise((resolve) => {
					setTimeout(() => resolve("loaded v" + $state.version), 10),
				),
			);
		},
	});

	/* User interface */
	t_body += `<![>`;
	t_body += `<p>Loading...</p>`;
	t_body += `<!]><!>`;
}
