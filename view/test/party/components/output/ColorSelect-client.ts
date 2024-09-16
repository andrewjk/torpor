import $watch from '../../../../../tera/view/src/$watch';
import t_fragment from '../../../../../tera/view/src/render/getFragment';
import t_root from '../../../../../tera/view/src/render/nodeRoot';
import t_child from '../../../../../tera/view/src/render/nodeChild';
import t_next from '../../../../../tera/view/src/render/nodeNext';
import t_anchor from '../../../../../tera/view/src/render/findAnchor';
import t_run_list from '../../../../../tera/view/src/render/runList';
import t_push_range_to_parent from '../../../../../tera/view/src/render/pushRangeToParent';
import t_attribute from '../../../../../tera/view/src/render/setAttribute';
import $run from '../../../../../tera/view/src/$run';
import t_fmt from '../../../../../tera/view/src/render/formatText';
import t_add_fragment from '../../../../../tera/view/src/render/addFragment';
import t_pop_range from '../../../../../tera/view/src/render/popRange';
import t_apply_props from '../../../../../tera/view/src/render/applyProps';
import t_event from '../../../../../tera/view/src/render/addEvent';

const ColorSelect = {
	name: "ColorSelect",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		/* User script */
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
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <div>#</div> <select> <!> </select> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_text_1 = t_child(t_next(t_child(t_div_1)));
		const t_select_1 = t_next(t_next(t_next(t_child(t_div_1))));
		const t_for_anchor_1 = t_anchor(t_next(t_child(t_select_1)));

		/* @for */
		let t_for_range_1 = {};
		t_run_list(
			t_for_range_1,
			t_select_1,
			t_for_anchor_1,
			function createNewItems() {
				let t_new_items = [];
				for (let color of colors) {
					t_new_items.push({
						data: { color }
					});
				}
				return t_new_items;
			},
			function createListItem(t_item, t_before) {
				let t_old_range_1 = t_push_range_to_parent(t_item);
				const t_fragment_1 = t_fragment(t_fragments, 1, ` <option>#</option> `);
				const t_root_1 = t_root(t_fragment_1);
				const t_option_1 = t_next(t_root_1);
				const t_text_2 = t_child(t_option_1);
				const t_text_3 = t_next(t_option_1);
				$run(function setAttribute() {
					t_attribute(t_option_1, "value", t_item.data.color.id);
				});
				$run(function setAttribute() {
					t_attribute(t_option_1, "disabled", t_item.data.color.isDisabled);
				});
				$run(function setTextContent() {
					t_text_2.textContent = ` ${t_fmt(t_item.data.color.text)} `;
				});
				t_add_fragment(t_fragment_1, t_select_1, t_before);
				t_next(t_text_3);
				t_pop_range(t_old_range_1);
			}
		);


		t_apply_props(t_div_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = `Selected: ${t_fmt(colors[$state.selectedColorId - 1].text)}`;
		});
		$run(function setBinding() {
			t_select_1.value = $state.selectedColorId || "";
		});
		t_event(t_select_1, "change", (e) => $state.selectedColorId = e.target.value);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default ColorSelect;
