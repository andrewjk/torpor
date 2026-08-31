import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function RemountTest(
	$props: { show: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ count: 0 })

	/* User interface */
	t_body += `<button id="inc">+</button> <p>Count: ${t_fmt($state.count)}</p> `;

	function increment() {
		$state.count += 1
	};

	t_body += ` <![>`;
	if ($props.show) {
		t_body += `<!^><div id="conditional">Visible</div>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
