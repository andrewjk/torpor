import $run from "../../../../src/watch/$run";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_attribute from "../../../../src/render/setAttribute";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
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

export default function ForEscape(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	let things = ["a", "b", "c", "d", "e"]

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
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p>#</p> <div data-testid=""></div> <div data-testid=""></div> <div data-testid=""></div> <input> `);
			const t_root_1 = t_root(t_fragment_1, true);
			const t_text_1 = t_child(t_next(t_root_1));
			const t_div_1 = t_next(t_next(t_next(t_root_1), true)) as HTMLDivElement;
			const t_div_2 = t_next(t_next(t_div_1, true)) as HTMLDivElement;
			const t_div_3 = t_next(t_next(t_div_2, true)) as HTMLDivElement;
			const t_input_1 = t_next(t_next(t_div_3, true)) as HTMLInputElement;
			const t_text_2 = t_next(t_input_1, true);
			$run(() => {
				t_input_1.value = t_item_1.data.i || "";
			});
			t_event(t_input_1, "input", (e) => t_item_1.data.i = e.target.value);
			$run(() => {
				t_text_1.textContent = t_fmt(t_item_1.data.i);
				t_attribute(t_div_1, "data-testid", `input1-${t_item_1.data.i}`);
				t_attribute(t_div_1, "name", t_item_1.data.i);
				t_attribute(t_div_2, "data-testid", `input2-${t_item_1.data.i}`);
				t_attribute(t_div_2, "name", `${t_item_1.data.i}`);
				t_attribute(t_div_3, "data-testid", `input3-${t_item_1.data.i}`);
				t_attribute(t_div_3, "name", things[t_item_1.data.i]);
				t_attribute(t_input_1, "name", `${t_item_1.data.i}`);
			});
			t_add_fragment(t_fragment_1, t_for_parent_1, t_before_1, t_text_2);
			t_next(t_text_2);
			t_pop_region(t_old_region_1);
		},
		(t_old_item, t_new_item) => {
			t_old_item.data.i = t_new_item.data.i;
		}
	);

	const t_text_3 = t_next(t_for_parent_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
	t_next(t_text_3);

}
