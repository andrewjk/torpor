import $peek from "../../../../src/watch/$peek";
import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import type ListItem from "../../../../src/types/ListItem";
import type SlotRender from "../../../../src/types/SlotRender";
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

export default function ColorSelect(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
): void {
	$peek(() => { /**/

	let $state = $watch({
		selectedColorId: 2
	});

	const colors = [
		{ id: 1, text: "red" },
		{ id: 2, text: "blue" },
		{ id: 3, text: "green" },
		{ id: 4, text: "gray", isDisabled: true },
	];

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <div>#</div> <select> <!> </select> `);
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_root_0));
	const t_select_1 = t_next(t_next(t_next(t_root_0), true)) as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_next(t_child(t_select_1))) as HTMLElement;

	/* @for */
	let t_for_region_1 = t_region();
	t_run_list(
		t_for_region_1,
		t_select_1,
		t_for_anchor_1,
		() => {
			let t_new_items_1: ListItem[] = [];
			let t_previous_item_1 = t_for_region_1;
			let t_next_item_1 = t_for_region_1.nextRegion;
			for (let color of colors) {
				let t_new_item_1 = t_list_item(
					{ color },
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
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <option>#</option> `);
			const t_root_1 = t_root(t_fragment_1, true);
			const t_option_1 = t_next(t_root_1) as HTMLElement;
			const t_text_2 = t_child(t_option_1);
			const t_text_3 = t_next(t_option_1, true);
			$run(() => {
				t_attribute(t_option_1, "value", t_item_1.data.color.id);
				t_attribute(t_option_1, "disabled", t_item_1.data.color.isDisabled);
				t_text_2.textContent = ` ${t_fmt(t_item_1.data.color.text)} `;
			});
			t_add_fragment(t_fragment_1, t_select_1, t_before_1, t_text_3);
			t_next(t_text_3);
			t_pop_region(t_old_region_1);
		},
		(t_old_item, t_new_item) => {
			t_old_item.data.color = t_new_item.data.color;
		}
	);

	const t_text_4 = t_next(t_select_1, true);
	$run(() => {
		t_select_1.value = $state.selectedColorId || "";
	});
	t_event(t_select_1, "change", (e) => $state.selectedColorId = e.target.value);
	$run(() => {
		t_text_1.textContent = `Selected: ${t_fmt(colors[$state.selectedColorId - 1].text)}`;
	});
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_4);
	t_next(t_text_4);

	/**/ });
}
