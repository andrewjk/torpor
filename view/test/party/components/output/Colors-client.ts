import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_child from '../../../../../tera/view/src/render/internal/nodeChild';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';
import t_anchor from '../../../../../tera/view/src/render/internal/findAnchor';
import t_run_list from '../../../../../tera/view/src/render/internal/runList';
import t_push_range_to_parent from '../../../../../tera/view/src/render/internal/pushRangeToParent';
import t_fmt from '../../../../../tera/view/src/render/internal/formatText';
import $run from '../../../../../tera/view/src/watch/$run';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';
import t_pop_range from '../../../../../tera/view/src/render/internal/popRange';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';

const Colors = {
	name: "Colors",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		/* User script */
		const colors = ["red", "green", "blue"];
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<ul> <!> </ul>`);
		const t_ul_1 = t_root(t_fragment_0);
		const t_for_anchor_1 = t_anchor(t_next(t_child(t_ul_1)));

		/* @for */
		let t_for_range_1 = {};
		t_run_list(
			t_for_range_1,
			t_ul_1,
			t_for_anchor_1,
			function createNewItems() {
				let t_new_items = [];
				for (let color of colors) {
					t_new_items.push({
						key: color,
						data: { color }
					});
				}
				return t_new_items;
			},
			function createListItem(t_item, t_before) {
				let t_old_range_1 = t_push_range_to_parent(t_item);
				const t_fragment_1 = t_fragment(t_fragments, 1, ` <li>#</li> `);
				const t_root_1 = t_root(t_fragment_1);
				const t_text_1 = t_child(t_next(t_root_1));
				const t_text_2 = t_next(t_next(t_root_1));
				$run(function setTextContent() {
					let color = t_item.data.color; 
					t_text_1.textContent = t_fmt(color);
				});
				t_add_fragment(t_fragment_1, t_ul_1, t_before);
				t_next(t_text_2);
				t_pop_range(t_old_range_1);
			}
		);


		t_apply_props(t_ul_1, $props, []);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Colors;
