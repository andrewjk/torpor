import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_range from "../../../../src/render/newRange";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";

export default function IfElse(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { counter: number },
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_if_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @if */
	const t_if_range_1 = t_range();
	let $t_if_state_1 = $watch({ index: -1 });
	let t_if_creators_1: ((t_before: Node | null) => void)[] = [];
	$run(function runIf() {
		if ($props.counter > 7) {
			t_if_creators_1[0] = (t_before) => {
				const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p> It's true! </p> <p> That's right </p> `);
				const t_root_1 = t_root(t_fragment_1, true);
				const t_text_1 = t_next(t_next(t_next(t_next(t_root_1), true)), true);
				t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_text_1);
				t_next(t_text_1);
			};
			$t_if_state_1.index = 0;
		}
		else {
			t_if_creators_1[1] = (t_before) => {
				const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <p> It's not true... </p> `);
				const t_root_2 = t_root(t_fragment_2, true);
				const t_text_2 = t_next(t_next(t_root_2), true);
				t_add_fragment(t_fragment_2, t_fragment_0, t_before, t_text_2);
				t_next(t_text_2);
			};
			$t_if_state_1.index = 1;
		}
	});
	t_run_control(t_if_range_1, t_if_anchor_1, (t_before) => {
		t_run_branch(t_if_range_1, () => t_if_creators_1[$t_if_state_1.index](t_before));
	});

	const t_text_3 = t_next(t_if_anchor_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
	t_next(t_text_3);

}
