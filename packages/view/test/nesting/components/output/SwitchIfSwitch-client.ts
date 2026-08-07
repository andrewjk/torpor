import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
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

export default function SwitchInsideIfInsideSwitch(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { level: string; kind: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_switch_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @switch */
	const t_switch_region_1 = t_region();
	let t_switch_index_1 = -1;
	t_run_control(t_switch_region_1, t_switch_anchor_1, (t_before) => {
		switch ($props.level) {
			case "top": {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 0)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<!>`);
				const t_root_1 = t_root(t_fragment_1);
				let t_if_anchor_1 = t_anchor(t_root_1) as HTMLElement;

				/* @if */
				const t_if_region_1 = t_region();
				let t_if_index_1 = -1;
				t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
					if ($props.kind === "a") {
						if (!t_run_branch(t_if_region_1, t_if_index_1, 0)) return;
						const t_new_region = t_region();
						const t_old_region = t_push_region(t_new_region, true);
						const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, `<!>`);
						const t_root_2 = t_root(t_fragment_2);
						let t_switch_anchor_2 = t_anchor(t_root_2) as HTMLElement;

						/* @switch */
						const t_switch_region_2 = t_region();
						let t_switch_index_2 = -1;
						t_run_control(t_switch_region_2, t_switch_anchor_2, (t_before) => {
							switch ($props.kind) {
								case "a": {
									if (!t_run_branch(t_switch_region_2, t_switch_index_2, 0)) return;
									const t_new_region = t_region();
									const t_old_region = t_push_region(t_new_region, true);
									const t_fragment_3 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 3, `<p>Top A1</p>`);
									const t_root_3 = t_root_el(t_fragment_3);
									const t_p_1 = t_root_3 as HTMLElement;
									t_add_element(t_p_1, t_fragment_2, t_before);
									t_next(t_p_1);
									t_pop_region(t_old_region);
									t_switch_index_2 = 0;
									break;
								}
								default: {
									if (!t_run_branch(t_switch_region_2, t_switch_index_2, 1)) return;
									const t_new_region = t_region();
									const t_old_region = t_push_region(t_new_region, true);
									const t_fragment_4 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 4, `<p>Top A-default</p>`);
									const t_root_4 = t_root_el(t_fragment_4);
									const t_p_2 = t_root_4 as HTMLElement;
									t_add_element(t_p_2, t_fragment_2, t_before);
									t_next(t_p_2);
									t_pop_region(t_old_region);
									t_switch_index_2 = 1;
									break;
								}
							}
						});

						t_add_fragment(t_fragment_2, t_fragment_1, t_before, t_switch_anchor_2, t_root_2);
						t_next(t_switch_anchor_2);
						t_pop_region(t_old_region);
						t_if_index_1 = 0;
					}
					else {
						if (!t_run_branch(t_if_region_1, t_if_index_1, 1)) return;
						const t_new_region = t_region();
						const t_old_region = t_push_region(t_new_region, true);
						const t_fragment_5 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 5, `<p>Top other</p>`);
						const t_root_5 = t_root_el(t_fragment_5);
						const t_p_3 = t_root_5 as HTMLElement;
						t_add_element(t_p_3, t_fragment_1, t_before);
						t_next(t_p_3);
						t_pop_region(t_old_region);
						t_if_index_1 = 1;
					}
				});

				t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_if_anchor_1, t_root_1);
				t_next(t_if_anchor_1);
				t_pop_region(t_old_region);
				t_switch_index_1 = 0;
				break;
			}
			case "bottom": {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 1)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_6 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 6, `<p>Bottom</p>`);
				const t_root_6 = t_root_el(t_fragment_6);
				const t_p_4 = t_root_6 as HTMLElement;
				t_add_element(t_p_4, t_fragment_0, t_before);
				t_next(t_p_4);
				t_pop_region(t_old_region);
				t_switch_index_1 = 1;
				break;
			}
			default: {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 2)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_7 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 7, `<p>Fallback</p>`);
				const t_root_7 = t_root_el(t_fragment_7);
				const t_p_5 = t_root_7 as HTMLElement;
				t_add_element(t_p_5, t_fragment_0, t_before);
				t_next(t_p_5);
				t_pop_region(t_old_region);
				t_switch_index_1 = 2;
				break;
			}
		}
	});

	t_add_fragment(t_fragment_0, $parent, $anchor, t_switch_anchor_1, t_root_0);
	t_next(t_switch_anchor_1);

}
