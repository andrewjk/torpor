import $watch from '../../../../../tera/view/src/watch/$watch';
import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_child from '../../../../../tera/view/src/render/internal/nodeChild';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import t_fmt from '../../../../../tera/view/src/render/internal/formatText';
import $run from '../../../../../tera/view/src/watch/$run';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';

const IsAvailable = {
	name: "IsAvailable",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$slots]
	 * @param {Object} [$context]
	 */
	render: ($parent, $anchor, $props, $slots, $context) => {
		/* User script */
		let $state = $watch({
			isAvailable: false
		});
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <div>#</div> <input id="is-available" type="checkbox"></input> <label for="is-available">Is available</label> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_text_1 = t_child(t_next(t_child(t_div_1)));
		const t_input_1 = t_next(t_next(t_next(t_child(t_div_1))));

		t_apply_props(t_div_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = t_fmt($state.isAvailable ? "Available" : "Not available");
		});
		$run(function setBinding() {
			t_input_1.checked = $state.isAvailable || false;
		});
		t_input_1.addEventListener("input", (e) => $state.isAvailable = e.target.checked);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default IsAvailable;
