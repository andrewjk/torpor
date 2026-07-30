import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_fragment from "../../../../src/render/getFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function IfNested(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { a: boolean; b: boolean },
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
		if ($props.a) {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<p>A is true</p> <!>`);
			const t_root_1 = t_root(t_fragment_1);
			let t_if_anchor_2 = t_anchor(t_next(t_next(t_root_1, true))) as HTMLElement;

			/* @if */
			const t_if_region_2 = t_region();
			let t_if_index_2 = -1;
			t_run_control(t_if_region_2, t_if_anchor_2, (t_before) => {
				if ($props.b) {
					if (!t_run_branch(t_if_region_2, t_if_index_2, 0)) return;
					const t_new_region = t_region();
					const t_old_region = t_push_region(t_new_region, true);
					const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, `<p>B is true</p>`);
					const t_p_1 = t_root(t_fragment_2) as HTMLElement;
					t_add_fragment(t_fragment_2, t_fragment_1, t_before, t_p_1);
					t_next(t_p_1);
					t_pop_region(t_old_region);
					t_if_index_2 = 0;
				}
				else {
					if (!t_run_branch(t_if_region_2, t_if_index_2, 1)) return;
					const t_new_region = t_region();
					const t_old_region = t_push_region(t_new_region, true);
					const t_fragment_3 = t_fragment($parent.ownerDocument!, t_fragments, 3, `<p>B is false</p>`);
					const t_p_2 = t_root(t_fragment_3) as HTMLElement;
					t_add_fragment(t_fragment_3, t_fragment_1, t_before, t_p_2);
					t_next(t_p_2);
					t_pop_region(t_old_region);
					t_if_index_2 = 1;
				}
			});

			t_add_fragment(t_fragment_1, t_fragment_0, t_before);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else {
			if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
			const t_new_region = t_region();
			const t_old_region = t_push_region(t_new_region, true);
			const t_fragment_4 = t_fragment($parent.ownerDocument!, t_fragments, 4, `<p>A is false</p>`);
			const t_p_3 = t_root(t_fragment_4) as HTMLElement;
			t_add_fragment(t_fragment_4, t_fragment_0, t_before, t_p_3);
			t_next(t_p_3);
			t_pop_region(t_old_region);
			t_if_index_1 = 1;
		}
	});

	t_add_fragment(t_fragment_0, $parent, $anchor);

}
