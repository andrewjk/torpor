import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_region from "../../../../src/render/newRegion";
import t_rerun_region_effects from "../../../../src/render/rerunRegionEffects";
import t_root from "../../../../src/render/nodeRoot";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_list from "../../../../src/render/runList";
import type ListItemSpec from "../../../../src/types/ListItemSpec";
import type SlotRender from "../../../../src/types/SlotRender";

export default function Let(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

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
		$slot: Record<PropertyKey, any>,
		_$context?: Record<PropertyKey, any>
	) => {
		const t_fragment_2 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 2, `<b>#</b>`);
		const t_root_2 = t_root_el(t_fragment_2);
		const t_b_1 = t_root_2 as HTMLElement;
		const t_text_1 = t_child(t_b_1);
		$run(() => {
			t_text_1.textContent = t_fmt($slot.item.text);
		});
		t_add_element(t_b_1, $sparent, $sanchor);
	}
	List(t_fragment_0, t_comp_anchor_1, t_props_1, $context, t_slots_1);

	t_add_fragment(t_fragment_0, $parent, $anchor, t_comp_anchor_1, t_root_0);

}

function List(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<!>`);
	const t_root_0 = t_root(t_fragment_0);
	let t_for_anchor_1 = t_anchor(t_root_0) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_fragment_0,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItemSpec[] = [];
			for (let item of $props.items) {
				t_new_items_1.push({ data: item });
			}
			return t_new_items_1;
		},
		(t_item_1, t_before_1) => {
			const item = t_item_1.data;
			const t_fragment_1 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 1, `<div class="row"><!></div>`);
			const t_root_1 = t_root_el(t_fragment_1);
			const t_div_1 = t_root_1 as HTMLDivElement;
			let t_slot_anchor_1 = t_anchor(t_child(t_div_1)) as HTMLElement;
			const t_slot_props_1 = $watch({
				item: item,
			});
			$run(() => {
				const item = t_item_1.data;
				t_slot_props_1["item"] = item;
			}, undefined, { forVarMask: 1 });
			if ($slots && $slots["_"]) {
				$slots["_"](t_div_1, t_slot_anchor_1, t_slot_props_1, $context)
			}
			t_add_element(t_div_1, t_fragment_0, t_before_1);
		},
		(t_old_item, t_new_item) => {
			let t_changed_mask = 0;
			if (t_old_item.data !== t_new_item.data) {
				t_old_item.data = t_new_item.data;
				t_changed_mask = 1;
			}
			if (t_changed_mask) t_rerun_region_effects(t_old_item, t_changed_mask);
		},
		true
	);

	t_add_fragment(t_fragment_0, $parent, $anchor, t_for_anchor_1, t_root_0);

}
