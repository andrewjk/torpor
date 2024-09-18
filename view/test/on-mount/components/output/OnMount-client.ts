import { $run } from '@tera/view';
import { t_add_fragment } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_root } from '@tera/view';

const OnMount = {
	name: "OnMount",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<input></input>`);
		const t_input_1 = t_root(t_fragment_0);

		t_apply_props(t_input_1, $props, []);
		$run(function elMount() {
			return ((node) => node.value = "hi")(t_input_1);
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default OnMount;
