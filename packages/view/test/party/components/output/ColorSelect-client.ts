import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type ListItem } from "../../../../src/types/ListItem";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_attribute from "../../../../src/render/setAttribute";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_list_item from "../../../../src/render/newListItem";
import t_next from "../../../../src/render/nodeNext";
import t_pop_range from "../../../../src/render/popRange";
import t_push_range from "../../../../src/render/pushRange";
import t_range from "../../../../src/render/newRange";
import t_root from "../../../../src/render/nodeRoot";
import t_run_list from "../../../../src/render/runList";

export default function ColorSelect(
	$parent: ParentNode,
	$anchor: Node | null,
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {

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
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	const t_text_1 = t_child(t_next(t_root_0));
	const t_select_1 = t_next(t_next(t_next(t_root_0), true)) as HTMLElement;
	let t_for_anchor_1 = t_anchor(t_next(t_child(t_select_1))) as HTMLElement;

	/* @for */
	let t_for_range_1 = t_range();
	t_run_list(
		t_for_range_1,
		t_select_1,
		t_for_anchor_1,
		function createNewItems() {
			let t_new_items: ListItem[] = [];
			for (let color of colors) {
				t_new_items.push(t_list_item({ color }));
				/*t_new_items.push({
					data: { color }
				});*/
			}
			return t_new_items;
		},
		function createListItem(t_item, t_before) {
			let t_old_range_1 = t_push_range(t_item, true);
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <option>#</option> `);
			// @ts-ignore
			const t_root_1 = t_root(t_fragment_1, true);
			const t_option_1 = t_next(t_root_1) as HTMLElement;
			const t_text_2 = t_child(t_option_1);
			// @ts-ignore
			const t_text_3 = t_next(t_option_1, true);
			$run(function setAttribute() {
				t_attribute(t_option_1, "value", t_item.data.color.id);
			});
			$run(function setAttribute() {
				t_attribute(t_option_1, "disabled", t_item.data.color.isDisabled);
			});
			$run(function setTextContent() {
				t_text_2.textContent = ` ${t_fmt(t_item.data.color.text)} `;
			});
			t_add_fragment(t_fragment_1, t_select_1, t_before, t_text_3);
			t_next(t_text_3);
			t_pop_range(t_old_range_1);
		}
	);

	// @ts-ignore
	const t_text_4 = t_next(t_select_1, true);
	$run(function setTextContent() {
		t_text_1.textContent = `Selected: ${t_fmt(colors[$state.selectedColorId - 1].text)}`;
	});
	$run(function setBinding() {
		t_select_1.value = $state.selectedColorId || "";
	});
	t_event(t_select_1, "change", (e) => $state.selectedColorId = e.target.value);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_4);
	t_next(t_text_4);

}
