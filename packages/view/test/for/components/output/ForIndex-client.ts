import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_list_item from "../../../../src/render/newListItem";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_rerun_region_effects from "../../../../src/render/rerunRegionEffects";
import t_root from "../../../../src/render/nodeRoot";
import t_run_list from "../../../../src/render/runList";
import type ListItem from "../../../../src/types/ListItem";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ForIndex(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { list: string[] },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<ul><!></ul>`);
	const t_ul_1 = t_root(t_fragment_0) as HTMLElement;
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
			for (let i = 0; i < $props.list.length; i++) {
				let t_new_item_1 = t_list_item(
					{ i },
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
			let t_old_region_1 = t_push_region(t_item_1);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<li>#</li>`);
			const t_li_1 = t_root(t_fragment_1) as HTMLElement;
			const t_text_1 = t_child(t_li_1);
			$run(() => {
				t_text_1.textContent = `Item ${t_fmt(t_item_1.data.i)}: ${t_fmt($props.list[t_item_1.data.i])}`;
			});
			t_add_fragment(t_fragment_1, t_ul_1, t_before_1, t_li_1);
			t_next(t_li_1);
			t_pop_region(t_old_region_1);
		},
		(t_old_item, t_new_item) => {
			let t_changed = false;
			if (t_old_item.data.i !== t_new_item.data.i) {
				t_old_item.data.i = t_new_item.data.i;
				t_changed = true;
			}
			if (t_changed) t_rerun_region_effects(t_old_item);
		},
		true
	);

	t_add_fragment(t_fragment_0, $parent, $anchor, t_ul_1);
	t_next(t_ul_1);

}
