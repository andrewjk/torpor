import $peek from "../../../../src/watch/$peek";
import $run from "../../../../src/watch/$run";
import type ListItem from "../../../../src/types/ListItem";
import type SlotRender from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_clear from "../../../../src/render/clearRegion";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_list_item from "../../../../src/render/newListItem";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_control from "../../../../src/render/runControl";
import t_run_list from "../../../../src/render/runList";

export default function ForContainingIf(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
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
		() => {
			let t_new_items_1: ListItem[] = [];
			let t_previous_item_1 = t_for_region_1;
			let t_next_item_1 = t_for_region_1.nextRegion;
			for (let i = 0; i < 5; i++) {
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
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <!> `);
			const t_root_1 = t_root(t_fragment_1, true);
			let t_if_anchor_1 = t_anchor(t_next(t_root_1)) as HTMLElement;

			/* @if */
			const t_if_region_1 = t_region();
			let t_if_index_1 = -1;
			t_run_control(t_if_region_1, t_if_anchor_1, (t_before) => {
				if (t_item_1.data.i > 2) {
					if (t_if_index_1 === 0) return;
					if (t_if_region_1.depth === -2) return;
					if (t_if_region_1.nextRegion !== null && t_if_region_1.nextRegion.depth > t_if_region_1.depth) {
						t_clear(t_if_region_1.nextRegion);
					}
					const t_new_region = t_region();
					const t_old_region = t_push_region(t_new_region, true);
					const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, ` <p>#</p> `);
					const t_root_2 = t_root(t_fragment_2, true);
					const t_text_1 = t_child(t_next(t_root_2));
					const t_text_2 = t_next(t_next(t_root_2), true);
					$run(() => {
						t_text_1.textContent = ` ${t_fmt(t_item_1.data.i)} `;
					});
					t_add_fragment(t_fragment_2, t_fragment_1, t_before, t_text_2);
					t_next(t_text_2);
					t_pop_region(t_old_region);
					t_if_index_1 = 0;
				}
				else {
					if (t_if_index_1 === 1) return;
					if (t_if_region_1.depth === -2) return;
					if (t_if_region_1.nextRegion !== null && t_if_region_1.nextRegion.depth > t_if_region_1.depth) {
						t_clear(t_if_region_1.nextRegion);
					}
					t_if_index_1 = 1;
				}
			});

			const t_text_3 = t_next(t_if_anchor_1, true);
			t_add_fragment(t_fragment_1, t_for_parent_1, t_before_1, t_text_3);
			t_next(t_text_3);
			t_pop_region(t_old_region_1);
		},
		(t_old_item, t_new_item) => {
			t_old_item.data.i = t_new_item.data.i;
		}
	);

	const t_text_4 = t_next(t_for_parent_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_4);
	t_next(t_text_4);

	/**/ });
}
