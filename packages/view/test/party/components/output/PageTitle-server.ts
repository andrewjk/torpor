import $run from "../../../../src/render/$serverRun";
import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function PageTitle(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): void {
	let t_body = "";
	let t_head = "";

	let $state = $watch({
		pageTitle: ""
	});

	$run(() => {
		$state.pageTitle = document.title;
	});

	/* User interface */
	t_body += ` <p>Page title: ${t_fmt($state.pageTitle)}</p> `;

	return { body: t_body, head: t_head };
}
