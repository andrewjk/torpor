import { $run } from '@tera/view';
import { t_add_fragment } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_fmt } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_root } from '@tera/view';

const Header = {
	name: "Header",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		$props ||= {};

		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<h2>#</h2>`);
		const t_h2_1 = t_root(t_fragment_0);
		const t_text_1 = t_child(t_h2_1);

		t_apply_props(t_h2_1, $props, ['name']);
		$run(function setTextContent() {
			t_text_1.textContent = `Hi, ${t_fmt($props.name)}`;
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Header;
