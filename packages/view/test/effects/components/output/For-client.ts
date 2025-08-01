import $run from "../../../../src/render/$run";
import $watch from "../../../../src/render/$watch";
import { type ListItem } from "../../../../src/types/ListItem";
import { type SlotRender } from "../../../../src/types/SlotRender";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fmt from "../../../../src/render/formatText";
import t_fragment from "../../../../src/render/getFragment";
import t_list_item from "../../../../src/render/newListItem";
import t_next from "../../../../src/render/nodeNext";
import t_pop_range from "../../../../src/render/popRange";
import t_push_range from "../../../../src/render/pushRange";
import t_range from "../../../../src/render/newRange";
import t_root from "../../../../src/render/nodeRoot";
import t_run_list from "../../../../src/render/runList";

export default function For(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { items: { text: string }[] },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>
) {
	$props ??= $watch({});

	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment($parent.ownerDocument!, t_fragments, 0, ` <!> `);
	// @ts-ignore
	const t_root_0 = t_root(t_fragment_0, true);
	let t_for_anchor_1 = t_anchor(t_next(t_root_0)) as HTMLElement;

	/* @for */
	let t_for_range_1 = t_range();
	t_run_list(
		t_for_range_1,
		t_fragment_0,
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
			const t_fragment_1 = t_fragment($parent.ownerDocument!, t_fragments, 1, ` <p>#</p> `);
			// @ts-ignore
			const t_root_1 = t_root(t_fragment_1, true);
			const t_text_1 = t_child(t_next(t_root_1));
			// @ts-ignore
			const t_text_2 = t_next(t_next(t_root_1), true);
			$run(function setTextContent() {
				t_text_1.textContent = t_fmt(t_item.data.item.text);
			});
			t_add_fragment(t_fragment_1, t_fragment_0, t_before, t_text_2);
			t_next(t_text_2);
			t_pop_range(t_old_range_1);
		}
	);

	// @ts-ignore
	const t_text_3 = t_next(t_for_anchor_1, true);
	t_add_fragment(t_fragment_0, $parent, $anchor, t_text_3);
	t_next(t_text_3);

}
