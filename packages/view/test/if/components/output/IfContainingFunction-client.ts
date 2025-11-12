import $peek from "../../../../src/watch/$peek";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_event from "../../../../src/render/addEvent";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";

export default function IfContainingIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { condition: boolean, counter: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$peek(() => { /**/

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> `);
	const t_root_0 = t_root(t_fragment_0, true);
	let t_if_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let t_if_index_1 = -1;
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		if ($props.condition) {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <button>do it</button> `);
			const t_root_1 = t_root(t_fragment_1, true);
			const t_button_1 = t_next(t_root_1) as HTMLButtonElement;
			t_event(t_button_1, "click", doit);

			/* @function */
			function doit() {
				// it just needs to exist...
			};

			t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_button_1);
			t_next(t_button_1);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
			t_if_index_1 = 1;
		}
	});

	const t_text_1 = t_next(t_if_anchor_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_1);
	t_next(t_text_1);

	/**/ });
}
