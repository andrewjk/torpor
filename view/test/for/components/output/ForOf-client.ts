import { $run } from "@tera/view";
import type { ListItem } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_anchor } from "@tera/view";
import { t_child } from "@tera/view";
import { t_fmt } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_list_item } from "@tera/view";
import { t_next } from "@tera/view";
import { t_pop_range } from "@tera/view";
import { t_push_range } from "@tera/view";
import { t_range } from "@tera/view";
import { t_root } from "@tera/view";
import { t_run_list } from "@tera/view";

export default function ForOf(
	$parent: ParentNode,
	$anchor: Node | null,
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	const t_fragments: DocumentFragment[] = [];

	const t_fragment_0 = t_fragment(t_fragments, 0, `<section> <!> </section>`);
	const t_section_1 = t_root(t_fragment_0) as HTMLElement;
	const t_for_anchor_1 = t_anchor(t_next(t_child(t_section_1))) as HTMLElement;

	/* @for */
	let t_for_range_1 = t_range();
	t_run_list(
		t_for_range_1,
		t_section_1,
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
			const t_fragment_1 = t_fragment(t_fragments, 1, ` <p>#</p> `);
			const t_root_1 = t_root(t_fragment_1);
			const t_text_1 = t_child(t_next(t_root_1));
			const t_text_2 = t_next(t_next(t_root_1));
			$run(function setTextContent() {
				t_text_1.textContent = ` ${t_fmt(t_item.data.item)} `;
			});
			t_add_fragment(t_fragment_1, t_section_1, t_before);
			t_next(t_text_2);
			t_pop_range(t_old_range_1);
		}
	);

	t_add_fragment(t_fragment_0, $parent, $anchor);
	
}

