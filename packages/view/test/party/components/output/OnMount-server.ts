import $run from "../../../../src/ssr/$serverRun";
import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function PageTitle(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({
		pageTitle: ""
	});

	$run(() => {
		$state.pageTitle = document.title;
	});

	/* User interface */
	t_body += `<p>Page title: ${t_fmt($state.pageTitle)}</p>`;

	return { body: t_body, head: t_head };
}
