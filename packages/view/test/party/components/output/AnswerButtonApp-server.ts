import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

import AnswerButton from "../output/./AnswerButton-server";

export default function AnswerButtonApp(
	_$props: Record<PropertyKey, any>,
	$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

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
	t_body += ` <p>Are you happy?</p> <![>`;
	const t_props_1: any = {};
	t_props_1["onYes"] = onAnswerYes;
	t_props_1["onNo"] = onAnswerNo;

	const t_comp_1 = AnswerButton(t_props_1, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> <p style="font-size: 50px;">${t_fmt($state.isHappy ? "😀" : "😥")}</p> `;

	return { body: t_body, head: t_head };
}
