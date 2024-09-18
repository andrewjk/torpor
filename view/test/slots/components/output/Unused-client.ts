import Header from './Header.tera';
import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_root } from '@tera/view';

const Unused = {
	name: "Unused",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<!>`);
		const t_root_0 = t_root(t_fragment_0);
		const t_comp_anchor_1 = t_anchor(t_root_0);

		/* @component */

		Header.render(t_fragment_0, t_comp_anchor_1, undefined, $context);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Unused;
