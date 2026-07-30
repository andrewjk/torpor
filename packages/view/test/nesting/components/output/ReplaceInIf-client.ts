import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ReplaceInIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { counter: number; show: boolean },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	let t_if_anchor_1 = t_anchor(t_root(t_fragment_0)) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let t_if_index_1 = -1;
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		if ($props.show) {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<!>`);
			let t_replace_anchor_1 = t_anchor(t_root(t_fragment_1)) as HTMLElement;

			/* @replace */
			const t_replace_region_1 = t_region();
			t_run_control(t_replace_region_1, t_replace_anchor_1, (t_before) => {
				$props.counter;
				if (!t_run_branch(t_replace_region_1, 0, -1)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, `<p>#</p>`);
				const t_p_1 = t_root(t_fragment_2) as HTMLElement;
				const t_text_1 = t_child(t_p_1);
				$run(() => {
					t_text_1.textContent = `Replaced: ${t_fmt($props.counter)}`;
				});
				t_add_fragment(t_fragment_2, t_fragment_1, t_before, t_p_1);
				t_next(t_p_1);
				t_pop_region(t_old_region);
			});

			t_add_fragment(t_fragment_1, t_fragment_0, t_before);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, `<p>Hidden</p>`);
			const t_p_2 = t_root(t_fragment_3) as HTMLElement;
			t_add_fragment(t_fragment_3, t_fragment_0, t_before, t_p_2);
			t_next(t_p_2);
			t_pop_region(t_old_region);
			t_if_index_1 = 1;
		}
	});

	t_add_fragment(t_fragment_0, $parent, $anchor);

}
