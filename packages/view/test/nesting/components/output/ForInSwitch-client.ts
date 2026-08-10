import $run from "../../../../src/watch/$run";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_rerun_region_effects from "../../../../src/render/rerunRegionEffects";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_branch from "../../../../src/render/runControlBranch";
import t_run_control from "../../../../src/render/runControl";
import t_run_list from "../../../../src/render/runList";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ForInSwitch(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { choice: string; items: string[] },
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
		switch ($props.choice) {
			case "list": {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 0)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<ul><!></ul>`);
				const t_root_1 = t_root_el(t_fragment_1);
				const t_ul_1 = t_root_1 as HTMLElement;
				let t_for_anchor_1 = t_anchor(t_child(t_ul_1)) as HTMLElement;

				/* @for */
				let t_for_region_1 = t_region();
				t_run_list(
					t_for_region_1,
					t_ul_1,
					t_for_anchor_1,
					() => {
						let t_new_items_1: ListItemSpec[] = [];
						for (let item of $props.items) {
							t_new_items_1.push({ data: item, key:
							undefined });
						}
						return t_new_items_1;
					},
					(t_item_1, t_before_1) => {
						const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<li>#</li>`);
						const t_root_2 = t_root_el(t_fragment_2);
						const t_li_1 = t_root_2 as HTMLElement;
						const t_text_1 = t_child(t_li_1);
						$run(() => {
							t_text_1.textContent = t_fmt(t_item_1.data);
						});
						t_add_element(t_li_1, t_ul_1, t_before_1);
						t_next(t_li_1);
					},
					(t_old_item, t_new_item) => {
						let t_changed = false;
						if (t_old_item.data !== t_new_item.data) {
							t_old_item.data = t_new_item.data;
							t_changed = true;
						}
						if (t_changed) t_rerun_region_effects(t_old_item);
					},
					true
				);

				t_add_element(t_ul_1, t_fragment_0, t_before);
				t_next(t_ul_1);
				t_pop_region(t_old_region);
				t_switch_index_1 = 0;
				break;
			}
			case "count": {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 1)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_3 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 3, `<p>#</p>`);
				const t_root_3 = t_root_el(t_fragment_3);
				const t_p_1 = t_root_3 as HTMLElement;
				const t_text_2 = t_child(t_p_1);
				$run(() => {
					t_text_2.textContent = `Count: ${t_fmt($props.items.length)}`;
				});
				t_add_element(t_p_1, t_fragment_0, t_before);
				t_next(t_p_1);
				t_pop_region(t_old_region);
				t_switch_index_1 = 1;
				break;
			}
			default: {
				if (!t_run_branch(t_switch_region_1, t_switch_index_1, 2)) return;
				const t_new_region = t_region();
				const t_old_region = t_push_region(t_new_region, true);
				const t_fragment_4 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 4, `<p>Nothing</p>`);
				const t_root_4 = t_root_el(t_fragment_4);
				const t_p_2 = t_root_4 as HTMLElement;
				t_add_element(t_p_2, t_fragment_0, t_before);
				t_next(t_p_2);
				t_pop_region(t_old_region);
				t_switch_index_1 = 2;
				break;
			}
		}
	});

	t_add_fragment(t_fragment_0, $parent, $anchor, t_switch_anchor_1, t_root_0);
	t_next(t_switch_anchor_1);

}
