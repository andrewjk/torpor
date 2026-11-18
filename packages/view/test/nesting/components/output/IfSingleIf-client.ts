import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_pop_region from "../../../../src/render/popRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import t_skip from "../../../../src/render/nodeSkip";
import type SlotRender from "../../../../src/types/SlotRender";

export default function IfSingleIf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { outer: boolean, inner: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div><!></div> <footer>after</footer>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_if_parent_1 = t_root_0 as HTMLElement;
	let t_if_anchor_1 = t_anchor(t_child(t_if_parent_1)) as HTMLElement;

	/* @if */
	const t_if_region_1 = t_region();
	let t_if_index_1 = -1;
	t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
		if ($props.outer) {
			const t_old_region = t_run_branch(t_if_region_1, t_if_index_1, 0);
			if (t_old_region === null) return;
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<!>`);
			const t_root_1 = t_root(t_fragment_1);
			let t_if_anchor_2 = t_anchor(t_root_1) as HTMLElement;

			/* @if */
			const t_if_region_2 = t_region();
			let t_if_index_2 = -1;
			t_run_control(t_if_region_2, t_if_anchor_2, (t_before) => {
				if ($props.inner) {
					const t_old_region = t_run_branch(t_if_region_2, t_if_index_2, 0);
					if (t_old_region === null) return;
					const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<p>both</p>`);
					const t_root_2 = t_root_el(t_fragment_2);
					const t_p_1 = t_root_2 as HTMLElement;
					t_add_element(t_p_1, t_fragment_1, t_before);
					t_pop_region(t_old_region);
					t_if_index_2 = 0;
				}
				else {
					const t_old_region = t_run_branch(t_if_region_2, t_if_index_2, 1);
					if (t_old_region === null) return;
					t_pop_region(t_old_region);
					t_if_index_2 = 1;
				}
			});

			t_add_fragment(t_fragment_1, t_if_parent_1, t_before, t_if_anchor_2, t_root_1);
			t_pop_region(t_old_region);
			t_if_index_1 = 0;
		}
		else {
			const t_old_region = t_run_branch(t_if_region_1, t_if_index_1, 1);
			if (t_old_region === null) return;
			t_pop_region(t_old_region);
			t_if_index_1 = 1;
		}
	});

	const t_footer_1 = t_skip(t_if_parent_1, 2, 1) as HTMLElement;
	t_add_fragment(t_fragment_0, $parent, $anchor, t_footer_1, t_root_0);

}
