import { $watch } from "@tera/view/ssr";
import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

import AnswerButton from "./AnswerButton.tera";

export default function AnswerButtonApp(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	let $state = $watch({
		isHappy: true
	});

	function onAnswerNo() {
		$state.isHappy = false;
	}

	function onAnswerYes() {
		$state.isHappy = true;
	}

	
	/* User interface */
	let $output = "";
	$output += `<div> <p>Are you happy?</p> `;
	const t_props_1 = {};
	t_props_1["onYes"] = onAnswerYes;
	t_props_1["onNo"] = onAnswerNo;

	$output += AnswerButton(t_props_1, $context)
	$output += ` <p style="font-size: 50px;">${t_fmt($state.isHappy ? "😀" : "😥")}</p> </div>`;
	
	return $output;
}

