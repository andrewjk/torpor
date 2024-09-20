import { $run } from '@tera/view';
import type SlotRender from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_fmt } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_pop_range } from '@tera/view';
import { t_push_range } from '@tera/view';
import { t_range } from '@tera/view';
import { t_root } from '@tera/view';
import { t_run_list } from '@tera/view';

const ArrayIndexes = {
	/**
	 * The component's name.
	 */
	name: "ArrayIndexes",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: Node, $anchor: Node | null, $props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		$props ||= {};

		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<section> <p>^</p> <!> <p>$</p> </section>`);
		const t_section_1 = t_root(t_fragment_0);
		const t_for_anchor_1 = t_anchor(t_next(t_next(t_next(t_child(t_section_1)))));

		/* @for */
		let t_for_range_1 = t_range();
		t_run_list(
			t_for_range_1,
			t_section_1,
			t_for_anchor_1,
			function createNewItems() {
				let t_new_items = [];
				for (let i = 0; i < $props.items.length; i++) {
					t_new_items.push({
						key: $props.items[i].id,
						data: { i }
					});
				}
				return t_new_items;
			},
			function createListItem(t_item, t_before) {
				let t_old_range_1 = t_push_range(t_item, true);
				const t_fragment_1 = t_fragment(t_fragments, 1, ` <span>#</span> `);
				const t_root_1 = t_root(t_fragment_1);
				const t_text_1 = t_child(t_next(t_root_1));
				const t_text_2 = t_next(t_next(t_root_1));
				$run(function setTextContent() {
					t_text_1.textContent = ` ${t_fmt(t_item.data.i > 0 ? ", " : "")} ${t_fmt($props.items[t_item.data.i].text)} `;
				});
				t_add_fragment(t_fragment_1, t_section_1, t_before);
				t_next(t_text_2);
				t_pop_range(t_old_range_1);
			}
		);


		t_apply_props(t_section_1, $props, ['items']);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default ArrayIndexes;
