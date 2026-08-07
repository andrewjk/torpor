import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Page(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({ count: 0 });

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<p>#</p> <button>Increment</button> <form><input type="number" name="count"> <button type="submit">Set via server</button></form> <!>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_text_1 = t_child(t_root_0);
	const t_button_1 = t_next(t_next(t_root_0, true)) as HTMLButtonElement;
	let t_if_anchor_1 = t_anchor(t_next(t_next(t_next(t_next(t_button_1, true)), true))) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let t_if_index_1 = -1;
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		if ($props?.form?.message) {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<p style="color: green">#</p>`);
			const t_root_1 = t_root_el(t_fragment_1);
			const t_p_1 = t_root_1 as HTMLElement;
			const t_text_2 = t_child(t_p_1);
			$run(() => {
				t_text_2.textContent = t_fmt($props.form.message);
			});
			t_add_element(t_p_1, t_fragment_0, t_before);
			t_next(t_p_1);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
			t_if_index_1 = 1;
		}
	});

	t_event(t_button_1, "click", () => $state.count++);
	$run(() => {
		t_text_1.textContent = `The count is ${t_fmt($props.count)}.`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_if_anchor_1, t_root_0);
	t_next(t_if_anchor_1);

}
