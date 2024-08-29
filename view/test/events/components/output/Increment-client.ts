import $watch from '../../../../../tera/view/src/watch/$watch';
import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_child from '../../../../../tera/view/src/render/internal/nodeChild';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import t_fmt from '../../../../../tera/view/src/render/internal/formatText';
import $run from '../../../../../tera/view/src/watch/$run';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';

const Increment = {
	name: "Increment",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$slots]
	 * @param {Object} [$context]
	 */
	render: ($parent, $anchor, $props, $slots, $context) => {
		/* User script */
		const $state = $watch({ counter: 0 })

		function increment(e, num) {
			$state.counter += num || 1;
		}
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <button id="increment"> Increment </button> <button id="increment5"> Increment </button> <p>#</p> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_button_1 = t_next(t_child(t_div_1));
		const t_button_2 = t_next(t_next(t_button_1));
		const t_text_1 = t_child(t_next(t_next(t_button_2)));

		t_apply_props(t_div_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = ` The count is ${t_fmt($state.counter)}. `;
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
		t_button_1.addEventListener("click", increment);
		t_button_2.addEventListener("click", (e) => increment(e, 5));
	}
}

export default Increment;
