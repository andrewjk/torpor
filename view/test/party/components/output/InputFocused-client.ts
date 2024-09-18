import { $mount } from '@tera/view';
import { t_add_fragment } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_flush } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_root } from '@tera/view';

const InputFocused = {
	name: "InputFocused",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		/* User script */
		let inputElement;

		$mount(() => {
			// HACK: This is easier to test for
			inputElement.value = "hi";
		});
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<input></input>`);
		const t_input_1 = t_root(t_fragment_0);

		t_apply_props(t_input_1, $props, []);
		inputElement = t_input_1;
		t_add_fragment(t_fragment_0, $parent, $anchor);

		t_flush();
	}
}

export default InputFocused;
