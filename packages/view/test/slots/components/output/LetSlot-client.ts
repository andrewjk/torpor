import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_list_item from "../../../../src/render/newListItem";
import t_next from "../../../../src/render/nodeNext";
import t_region from "../../../../src/render/newRegion";
import t_rerun_region_effects from "../../../../src/render/rerunRegionEffects";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_list from "../../../../src/render/runList";
import type ListItem from "../../../../src/types/ListItem";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Let(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_comp_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @component */
	let t_props_1 = $watch({
		items: $props.items,
	});
	$run(() => {
		t_props_1["items"] = $props.items;
	});
	const t_slots_1: Record<string, SlotRender> = {};
	// @ts-ignore
	t_slots_1["_"] = (
		$sparent: ParentNode,
		$sanchor: Node | null,
		// @ts-ignore
		$slot: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, `#`);
		const t_text_1 = t_root(t_fragment_2);
		$run(() => {
			t_text_1.textContent = ` ${t_fmt($slot.item.text)} `;
		});
		t_add_fragment(t_fragment_2, $sparent, $sanchor, t_text_1);
		t_next(t_text_1);
	}
	List(t_fragment_0, t_comp_anchor_1, t_props_1, $context, t_slots_1);

	t_add_fragment(t_fragment_0, $parent, $anchor);

}

function List(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<ul><!></ul>`);
	const t_ul_1 = t_root_el(t_fragment_0) as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_child(t_ul_1)) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_ul_1,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItem[] = [];
			let t_previous_item_1 = t_for_region_1;
			let t_next_item_1 = t_for_region_1.nextRegion;
			for (let item of $props.items) {
				let t_new_item_1 = t_list_item(
					{ item },
				);
				t_new_item_1.previousRegion = t_previous_item_1;
				t_previous_item_1.nextRegion = t_new_item_1;
				t_previous_item_1 = t_new_item_1;
				t_new_items_1.push(t_new_item_1);
			}
			t_for_region_1.nextRegion = t_next_item_1;
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<li><!></li>`);
			const t_li_1 = t_root_el(t_fragment_1) as HTMLElement;
			let t_slot_anchor_1 = t_anchor(t_child(t_li_1)) as HTMLElement;
			const t_slot_props_1 = $watch({
				item: t_item_1.data.item,
			});
			$run(() => {
				t_slot_props_1["item"] = t_item_1.data.item;
			});
			if ($slots && $slots["_"]) {
				$slots["_"](t_li_1, t_slot_anchor_1, t_slot_props_1, $context)
			}
			t_add_element(t_li_1, t_ul_1, t_before_1);
			t_next(t_li_1);
		},
		(t_old_item, t_new_item) => {
			let t_changed = false;
			if (t_old_item.data.item !== t_new_item.data.item) {
				t_old_item.data.item = t_new_item.data.item;
				t_changed = true;
			}
			if (t_changed) t_rerun_region_effects(t_old_item);
		},
		true
	);

	t_add_element(t_ul_1, $parent, $anchor);
	t_next(t_ul_1);

}
