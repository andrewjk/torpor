import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_class from "../../../../src/render/buildClasses";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_range from "../../../../src/render/newRange";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";

export default function Shape(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { name: string },
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>
): void {
	$props ??= $watch({});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img"> <!> </svg> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_svg_1 = t_next(t_root_0) as HTMLElement;
	let t_if_anchor_1 = t_anchor(t_next(t_child(t_svg_1))) as HTMLElement;

	/* @if */
	const t_if_range_1 = t_range();
	let $t_if_state_1 = $watch({ creator: (_: Node | null) => {} });
	$run(function runIf() {
		if ($props.name === "rect") {
			$t_if_state_1.creator = (t_before) => {
				const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <rect width="100" height="100" fill="red"></rect> `, true);
				// @ts-ignore
				const t_root_1 = t_root(t_fragment_1, true);
				// @ts-ignore
				const t_text_1 = t_next(t_next(t_root_1), true);
				t_add_fragment(t_fragment_1, t_svg_1, t_before, t_text_1);
				t_next(t_text_1);
			}
		}
		else {
			$t_if_state_1.creator = (t_before) => {
				const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <circle r="45" cx="50" cy="50" fill="red"></circle> `, true);
				// @ts-ignore
				const t_root_2 = t_root(t_fragment_2, true);
				// @ts-ignore
				const t_text_2 = t_next(t_next(t_root_2), true);
				t_add_fragment(t_fragment_2, t_svg_1, t_before, t_text_2);
				t_next(t_text_2);
			}
		}
	});
	t_run_control(t_if_range_1, t_if_anchor_1, (t_before) => {
		t_run_branch(t_if_range_1, () => $t_if_state_1.creator(t_before));
	});

	// @ts-ignore
	const t_text_3 = t_next(t_svg_1, true);
	$run(function setAttributes() {
		t_svg_1.className.baseVal = t_class({ "svg-cls": true });
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
	t_next(t_text_3);

}
