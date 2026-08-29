import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_attribute from "../../../../src/render/setAttribute";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_region from "../../../../src/render/newRegion";
import t_rerun_region_effects from "../../../../src/render/rerunRegionEffects";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_list from "../../../../src/render/runList";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ForComment(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: string[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({ selected: "" })

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<ul><!></ul>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_ul_1 = t_root_0 as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_child(t_ul_1)) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_ul_1,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItemSpec[] = [];
			for (let [index, item] of $props.items.entries()) {
				t_new_items_1.push({ data: { index, item }, key:
				undefined });
			}
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<li><button data-testid="" data-selected="">#</button></li>`);
			const t_root_1 = t_root_el(t_fragment_1);
			const t_li_1 = t_root_1 as HTMLElement;
			const t_button_1 = t_child(t_li_1) as HTMLButtonElement;
			const t_text_1 = t_child(t_button_1);
			t_event(t_button_1, "click", (e: MouseEvent) => {
				// The field doesn't blur first, so mousedown it is
				e.preventDefault();
				$state.selected = item;
			});
			$run(() => {
				t_attribute(t_button_1, "data-testid", t_item_1.data.item);
				t_attribute(t_button_1, "data-selected", $state.selected === t_item_1.data.item ? "" : undefined);
				t_text_1.textContent = ` ${t_fmt(t_item_1.data.index)}: ${t_fmt(t_item_1.data.item)} `;
			}, undefined, { forVarMask: 3 });
			t_add_element(t_li_1, t_ul_1, t_before_1);
			t_next(t_li_1);
		},
		(t_old_item, t_new_item) => {
			let t_changed_mask = 0;
			if (t_old_item.data.index !== t_new_item.data.index) {
				t_old_item.data.index = t_new_item.data.index;
				t_changed_mask |= 1;
			}
			if (t_old_item.data.item !== t_new_item.data.item) {
				t_old_item.data.item = t_new_item.data.item;
				t_changed_mask |= 2;
			}
			if (t_changed_mask) t_rerun_region_effects(t_old_item, t_changed_mask);
		},
		true
	);

	t_add_element(t_ul_1, $parent, $anchor);
	t_next(t_ul_1);

}
