import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type ListItem } from "../../../../src/types/ListItem";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment from "../../../../src/render/getFragment";
import t_list_item from "../../../../src/render/newListItem";
import t_next from "../../../../src/render/nodeNext";
import t_pop_range from "../../../../src/render/popRange";
import t_push_range from "../../../../src/render/pushRange";
import t_range from "../../../../src/render/newRange";
import t_root from "../../../../src/render/nodeRoot";
import t_run_list from "../../../../src/render/runList";

export default function List(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	$context: Record<PropertyKey, any>,
	$slots: Record<string, SlotRender>
) {
	$props ??= $watch({});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <ul> <!> </ul> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_for_parent_1 = t_next(t_root_0) as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_next(t_child(t_for_parent_1))) as HTMLElement;

	/* @for */
	let t_for_range_1 = t_range();
	t_run_list(
		t_for_range_1,
		t_for_parent_1,
		t_for_anchor_1,
		function createNewItems() {
			let t_new_items: ListItem[] = [];
			for (let item of $props.items) {
				t_new_items.push(t_list_item({ item }));
				/*t_new_items.push({
					data: { item }
				});*/
			}
			return t_new_items;
		},
		function createListItem(t_item, t_before) {
			let t_old_range_1 = t_push_range(t_item, true);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <li> <!> </li> `);
			// @ts-ignore
			const t_root_1 = t_root(t_fragment_1, true);
			const t_slot_parent_1 = t_next(t_root_1) as HTMLElement;
			let t_slot_anchor_1 = t_anchor(t_next(t_child(t_slot_parent_1))) as HTMLElement;
			const t_sprops_1 = $watch({});
			$run(function setProp() {
				t_sprops_1["item"] = t_item.data.item;
			});
			if ($slots && $slots["_"]) {
				$slots["_"](t_slot_parent_1, t_slot_anchor_1, t_sprops_1, $context)
			}
			// @ts-ignore
			const t_text_1 = t_next(t_slot_parent_1, true);
			t_add_fragment(t_fragment_1, t_for_parent_1, t_before, t_text_1);
			t_next(t_text_1);
			t_pop_range(t_old_range_1);
		}
	);

	// @ts-ignore
	const t_text_2 = t_next(t_for_parent_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_2);
	t_next(t_text_2);

}
