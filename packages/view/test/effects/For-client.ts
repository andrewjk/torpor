import t_add_fragment from "../../src/render/addFragment";
import t_fmt from "../../src/render/formatText";
import t_fragment from "../../src/render/getFragment";
import t_list_item from "../../src/render/newListItem";
import t_region from "../../src/render/newRegion";
import t_anchor from "../../src/render/nodeAnchor";
import t_child from "../../src/render/nodeChild";
import t_next from "../../src/render/nodeNext";
import t_root from "../../src/render/nodeRoot";
import t_pop_region from "../../src/render/popRegion";
import t_push_region from "../../src/render/pushRegion";
import t_run_list from "../../src/render/runList";
import type ListItem from "../../src/types/ListItem";
import type SlotRender from "../../src/types/SlotRender";
import $peek from "../../src/watch/$peek";
import $run from "../../src/watch/$run";

export default function For(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: { text: string }[] },
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {
	$peek(() => {
		/**/

		/* User interface */
		const t_fragments: DocumentFragment[] = [];

		const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> `);
		const t_root_0 = t_root(t_fragment_0, true);
		let t_for_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

		/* @for */
		let t_for_region_1 = t_region();
		t_run_list(
			t_for_region_1,
			t_fragment_0,
			t_for_anchor_1,
			(oldItems, toDelete) => {
				/*
				let t_new_items: ListItem[] = [];
				let t_previous_item = t_for_region_1;
				let t_next_item = t_for_region_1.nextRegion;
				for (let item of $props.items) {
					let t_new_item = t_list_item({ item });
					t_new_item.previousRegion = t_previous_item;
					t_previous_item.nextRegion = t_new_item;
					t_previous_item = t_new_item;
					t_new_items.push(t_new_item);
				}
				t_for_region_1.nextRegion = t_next_item;
				return t_new_items;
				*/
				let t_new_items = new Map<PropertyKey, ListItem>();
				let t_previous_region = t_for_region_1;
				let t_next_region = t_for_region_1.nextRegion;
				let index = 0;
				for (let item of $props.items) {
					let key = index;

					let KEEP = 1;

					let t_new_item: ListItem;

					let oldItem = oldItems.get(key);
					if (oldItem) {
						oldItem.state = KEEP;
						t_new_items.set(key, oldItem);
						t_new_item = oldItem;
					} else {
						t_new_item = t_list_item({ item });
						t_new_item.create = (t_before) => {
							let t_old_region_1 = t_push_region(t_new_item);
							const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p>#</p> `);
							const t_root_1 = t_root(t_fragment_1, true);
							const t_text_1 = t_child(t_next(t_root_1));
							const t_text_2 = t_next(t_next(t_root_1), true);
							$run(() => {
								t_text_1.textContent = t_fmt(/*t_new_item.data.*/ item.text);
							});
							t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_text_2);
							t_next(t_text_2);
							t_pop_region(t_old_region_1);
						};
						t_new_items.set(key, t_new_item);
					}

					t_new_item.index = index;

					t_new_item.previousRegion = t_previous_region;
					t_previous_region.nextRegion = t_new_item;
					t_previous_region = t_new_item;

					index++;
				}
				t_for_region_1.nextRegion = t_next_region;
				return t_new_items;
			},
			/*(t_item, t_before) => {
			let t_old_region_1 = t_push_region(t_item);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p>#</p> `);
			const t_root_1 = t_root(t_fragment_1, true);
			const t_text_1 = t_child(t_next(t_root_1));
			const t_text_2 = t_next(t_next(t_root_1), true);
			$run(() => {
				t_text_1.textContent = t_fmt(t_item.data.item.text);
			});
			t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_text_2);
			t_next(t_text_2);
			t_pop_region(t_old_region_1);
		},
		(t_old_item, t_new_item) => {
			t_old_item.data.item = t_new_item.data.item;
		}*/
		);

		const t_text_3 = t_next(t_for_anchor_1, true);
		t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
		t_next(t_text_3);

		/**/
	});
}
