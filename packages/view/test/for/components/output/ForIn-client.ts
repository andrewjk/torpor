import $peek from "../../../../src/watch/$peek";
import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import type ListItem from "../../../../src/types/ListItem";
import type SlotRender from "../../../../src/types/SlotRender";
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
import t_root from "../../../../src/render/nodeRoot";
import t_run_list from "../../../../src/render/runList";

export default function ForIn(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$peek(() => { /**/

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <section> <!> </section> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_for_parent_1 = t_next(t_root_0) as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_next(t_child(t_for_parent_1))) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_for_parent_1,
		t_for_anchor_1,
		(t_old_items) => {
			let t_new_items = new Map<PropertyKey, ListItem>();
			let t_previous_region = t_for_region_1;
			// TODO: store nextSiblingRegion? for lists only???
			let t_next_region = t_for_region_1.nextRegion;
			while (t_next_region !== null) {
				if (t_next_region.depth <= t_for_region_1.depth) break;
				t_next_region = t_next_region.nextRegion;
			}
			let t_index = 0;
			for (let key in $props.item) {
				let t_key = t_index;
				let t_item: ListItem;
				let t_old_item = t_old_items.get(t_key);
				if (t_old_item !== undefined) {
					t_new_items.set(t_key, t_old_item);
					t_item = t_old_item;
					t_item.state = 1;
					t_item.data.key = key;
				} else {
					t_item = t_list_item(
						$watch({ key }, { shallow: true }),
						t_index,
						(t_before) => {
							let t_old_region_1 = t_push_region(t_item);
							const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p>#</p> `);
							const t_root_1 = t_root(t_fragment_1, true);
							const t_text_1 = t_child(t_next(t_root_1));
							const t_text_2 = t_next(t_next(t_root_1), true);
							$run(() => {
								t_text_1.textContent = ` ${t_fmt($props.item[t_item.data.key])} `;
							});
							t_add_fragment(t_fragment_1, t_for_parent_1, t_before, t_text_2);
							t_next(t_text_2);
							t_pop_region(t_old_region_1);
						},
					);
					t_new_items.set(t_key, t_item);
				}
				t_item.previousRegion = t_previous_region;
				t_previous_region.nextRegion = t_item;
				t_previous_region = t_item;
				t_index++;
			}
			t_previous_region.nextRegion = t_next_region;
			return t_new_items;
		});

		const t_text_3 = t_next(t_for_parent_1, true);
		t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
		t_next(t_text_3);

		/**/ });
	}
