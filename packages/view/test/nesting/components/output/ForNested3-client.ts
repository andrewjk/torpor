import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_class from "../../../../src/render/buildClasses";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_list_item from "../../../../src/render/newListItem";
import t_next from "../../../../src/render/nodeNext";
import t_pop_region from "../../../../src/render/popRegion";
import t_push_region from "../../../../src/render/pushRegion";
import t_region from "../../../../src/render/newRegion";
import t_root from "../../../../src/render/nodeRoot";
import t_run_list from "../../../../src/render/runList";
import type ListItem from "../../../../src/types/ListItem";
import type SlotRender from "../../../../src/types/SlotRender";

export default function ForNested3(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { matrix: number[][]; highlight: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, `<table><!></table>`);
	const t_table_1 = t_root(t_fragment_0) as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_child(t_table_1)) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_table_1,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItem[] = [];
			let t_previous_item_1 = t_for_region_1;
			let t_next_item_1 = t_for_region_1.nextRegion;
			for (let row of $props.matrix) {
				let t_new_item_1 = t_list_item(
					{ row },
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
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, `<tr><!></tr>`);
			const t_tr_1 = t_root(t_fragment_1) as HTMLElement;
			let t_for_anchor_2 = t_anchor(t_child(t_tr_1)) as HTMLElement;

			/* @for */
			let t_for_region_2 = t_region();
			t_run_list(
				t_for_region_2,
				t_tr_1,
				t_for_anchor_2,
				() => {
					let t_new_items_2: ListItem[] = [];
					let t_previous_item_2 = t_for_region_2;
					let t_next_item_2 = t_for_region_2.nextRegion;
					for (let cell of t_item_1.data.row) {
						let t_new_item_2 = t_list_item(
							{ cell },
						);
						t_new_item_2.previousRegion = t_previous_item_2;
						t_previous_item_2.nextRegion = t_new_item_2;
						t_previous_item_2 = t_new_item_2;
						t_new_items_2.push(t_new_item_2);
					}
					t_for_region_2.nextRegion = t_next_item_2;
					return t_new_items_2;
				},
				(t_item_2, t_before_2) => {
					let t_old_region_2 = t_push_region(t_item_2);
					const t_fragment_2 = t_fragment($parent.ownerDocument!, t_fragments, 2, `<td>#</td>`);
					const t_td_1 = t_root(t_fragment_2) as HTMLElement;
					const t_text_1 = t_child(t_td_1);
					$run(() => {
						t_td_1.className = t_class({ active: t_item_2.data.cell === $props.highlight });
						t_text_1.textContent = ` ${t_fmt(t_item_2.data.cell)} `;
					});
					t_add_fragment(t_fragment_2, t_tr_1, t_before_2, t_td_1);
					t_next(t_td_1);
					t_pop_region(t_old_region_2);
				},
				(t_old_item, t_new_item) => {
					t_old_item.data.cell = t_new_item.data.cell;
				}
			);

			t_add_fragment(t_fragment_1, t_table_1, t_before_1, t_tr_1);
			t_next(t_tr_1);
			t_pop_region(t_old_region_1);
		},
		(t_old_item, t_new_item) => {
			t_old_item.data.row = t_new_item.data.row;
		}
	);

	t_add_fragment(t_fragment_0, $parent, $anchor, t_table_1);
	t_next(t_table_1);

}
