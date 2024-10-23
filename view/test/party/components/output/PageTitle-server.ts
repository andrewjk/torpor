import { $run } from "@tera/view/ssr";
import { $watch } from "@tera/view/ssr";
import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function PageTitle(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	let $state = $watch({
		pageTitle: ""
	});

	$run(() => {
		$state.pageTitle = document.title;
	});

	
	/* User interface */
	let $output = "";
	$output += `<p>Page title: ${t_fmt($state.pageTitle)}</p>`;
	
	return $output;
}

