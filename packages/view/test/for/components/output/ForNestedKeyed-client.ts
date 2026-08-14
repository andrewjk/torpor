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

export default function ForNestedKeyed(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: {
		groups: Array<{ id: string, items: Array<{ id: number, label: string }> }>,
	},
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<div><!></div> <footer>after</footer>`);
	const t_root_0 = t_root(t_fragment_0);
	const t_for_parent_1 = t_root_0 as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_child(t_for_parent_1)) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_for_parent_1,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItemSpec[] = [];
			for (let g of $props.groups) {
				t_new_items_1.push({ data: { g }, key:
				g.id });
			}
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			let t_old_region_1 = t_push_region(t_item_1);
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<section><h2>#</h2> <ul><!></ul></section>`);
			const t_root_1 = t_root_el(t_fragment_1);
			const t_section_1 = t_root_1 as HTMLElement;
			const t_text_1 = t_child(t_child(t_section_1));
			const t_for_parent_2 = t_next(t_next(t_child(t_section_1), true)) as HTMLElement;
			let t_for_anchor_2 = t_anchor(t_child(t_next(t_next(t_child(t_section_1), true)))) as HTMLElement;

			/* @for */
			let t_for_region_2 = t_region();
			t_run_list(
				t_for_region_2,
				t_for_parent_2,
				t_for_anchor_2,
				() => {
					let t_new_items_2: ListItemSpec[] = [];
					for (let it of t_item_1.data.g.items) {
						t_new_items_2.push({ data: it, key:
						it.id });
					}
					return t_new_items_2;
				},
				(t_item_2, t_before_2) => {
					const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<li>#</li>`);
					const t_root_2 = t_root_el(t_fragment_2);
					const t_li_1 = t_root_2 as HTMLElement;
					const t_text_2 = t_child(t_li_1);
					$run(() => {
						t_text_2.textContent = t_fmt(t_item_2.data.label);
					}, undefined, { forVarMask: 2 });
					t_add_element(t_li_1, t_for_parent_2, t_before_2);
					t_next(t_li_1);
				},
				(t_old_item, t_new_item) => {
					let t_changed_mask = 0;
					if (t_old_item.data !== t_new_item.data) {
						t_old_item.data = t_new_item.data;
						t_changed_mask = 2;
					}
					if (t_changed_mask) t_rerun_region_effects(t_old_item, t_changed_mask);
				},
				true
			);

			$run(() => {
				t_text_1.textContent = t_fmt(t_item_1.data.g.id);
			}, undefined, { forVarMask: 1 });
			t_add_element(t_section_1, t_for_parent_1, t_before_1);
			t_next(t_section_1);
			t_pop_region(t_old_region_1);
		},
		(t_old_item, t_new_item) => {
			t_old_item.data.g = t_new_item.data.g;
		}
	);

	const t_footer_1 = t_next(t_next(t_for_parent_1, true)) as HTMLElement;
	t_add_fragment(t_fragment_0, $parent, $anchor, t_footer_1, t_root_0);
	t_next(t_footer_1);

}
