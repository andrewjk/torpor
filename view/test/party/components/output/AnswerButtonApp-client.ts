import { $run } from "@tera/view";
import { $watch } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_anchor } from "@tera/view";
import { t_child } from "@tera/view";
import { t_fmt } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_next } from "@tera/view";
import { t_root } from "@tera/view";

import AnswerButton from "./AnswerButton.tera";

export default function AnswerButtonApp(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
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
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <p>Are you happy?</p> <!> <p style="font-size: 50px;">#</p> </div>`);
	const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
	const t_comp_anchor_1 = t_anchor(t_next(t_next(t_next(t_child(t_div_1))))) as HTMLElement;

	/* @component */
	const t_props_1 = {};
	$run(function setProp() {
		t_props_1["onYes"] = onAnswerYes;
	});
	$run(function setProp() {
		t_props_1["onNo"] = onAnswerNo;
	});

	AnswerButton(t_div_1, t_comp_anchor_1, t_props_1, $context);
	const t_text_1 = t_child(t_next(t_next(t_comp_anchor_1)));
	$run(function setTextContent() {
		t_text_1.textContent = t_fmt($state.isHappy ? "😀" : "😥");
	});
	t_add_fragment(t_fragment_0, $parent, $anchor);
}

