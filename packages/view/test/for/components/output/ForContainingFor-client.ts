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
import t_run_list from "../../../../src/render/runList";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ForContainingFor(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<section><!></section>`);
	const t_section_1 = t_root_el(t_fragment_0) as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_child(t_section_1)) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_section_1,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItemSpec[] = [];
			for (let i = 0; i < 5; i++) {
				t_new_items_1.push({ data: { i }, key:
				undefined });
			}
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			let t_old_region_1 = t_push_region(t_item_1);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<!>`);
			let t_for_anchor_2 = t_anchor(t_root(t_fragment_1)) as HTMLElement;

			/* @for */
			let t_for_region_2 = t_region();
			t_run_list(
				t_for_region_2,
				t_fragment_1,
				t_for_anchor_2,
				() => {
					let t_new_items_2: ListItemSpec[] = [];
					for (let j = 0; j < 2; j++) {
						t_new_items_2.push({ data: { j }, key:
						undefined });
					}
					return t_new_items_2;
				},
				(t_item_2, t_before_2) => {
					const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<p>#</p>`);
					const t_p_1 = t_root_el(t_fragment_2) as HTMLElement;
					const t_text_1 = t_child(t_p_1);
					$run(() => {
						t_text_1.textContent = ` ${t_fmt(t_item_1.data.i)}-${t_fmt(t_item_2.data.j)} `;
					});
					t_add_element(t_p_1, t_fragment_1, t_before_2);
					t_next(t_p_1);
				},
				(t_old_item, t_new_item) => {
					let t_changed = false;
					if (t_old_item.data.j !== t_new_item.data.j) {
						t_old_item.data.j = t_new_item.data.j;
						t_changed = true;
					}
					if (t_changed) t_rerun_region_effects(t_old_item);
				},
				true
			);

			t_add_fragment(t_fragment_1, t_section_1, t_before_1);
			t_pop_region(t_old_region_1);
		},
		(t_old_item, t_new_item) => {
			t_old_item.data.i = t_new_item.data.i;
		}
	);

	t_add_element(t_section_1, $parent, $anchor);
	t_next(t_section_1);

}
