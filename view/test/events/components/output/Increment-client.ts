import { $run } from '@tera/view';
import { $watch } from '@tera/view';
import { t_add_fragment } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_event } from '@tera/view';
import { t_fmt } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_root } from '@tera/view';

const Increment = {
	name: "Increment",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
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
		t_event(t_button_1, "click", increment);
		t_event(t_button_2, "click", (e) => increment(e, 5));
		$run(function setTextContent() {
			t_text_1.textContent = ` The count is ${t_fmt($state.counter)}. `;
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Increment;
