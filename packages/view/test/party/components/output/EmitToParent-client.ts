import $peek from "../../../../src/watch/$peek";
import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_root from "../../../../src/render/nodeRoot";

export default function AnswerButtonApp(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$peek(() => { /**/

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

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <p>Are you happy?</p> <!> <p style="font-size: 50px;">#</p> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_comp_anchor_1 = t_anchor(t_next(t_next(t_next(t_root_0), true))) as HTMLElement;

	/* @component */
	const t_props_1 = $watch({
		onYes: onAnswerYes,
		onNo: onAnswerNo,
	});
	$run(() => {
		t_props_1["onYes"] = onAnswerYes;
		t_props_1["onNo"] = onAnswerNo;
	});
	AnswerButton(t_fragment_0, t_comp_anchor_1, t_props_1, $context);

	const t_text_1 = t_child(t_next(t_next(t_comp_anchor_1, true)));
	const t_text_2 = t_next(t_next(t_next(t_comp_anchor_1, true)), true);
	$run(() => {
		t_text_1.textContent = t_fmt($state.isHappy ? "😀" : "😥");
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

	/**/ });
}

function AnswerButton(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$peek(() => { /**/

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <button>YES</button> <button>NO</button> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_button_1 = t_next(t_root_0) as HTMLElement;
	const t_button_2 = t_next(t_next(t_button_1, true)) as HTMLElement;
	const t_text_1 = t_next(t_button_2, true);
	t_event(t_button_1, "click", $props.onYes);
	t_event(t_button_2, "click", $props.onNo);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

	/**/ });
}
