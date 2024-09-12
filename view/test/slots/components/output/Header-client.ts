import t_fragment from '../../../../../tera/view/src/render/getFragment';
import t_root from '../../../../../tera/view/src/render/nodeRoot';
import t_child from '../../../../../tera/view/src/render/nodeChild';
import t_next from '../../../../../tera/view/src/render/nodeNext';
import t_anchor from '../../../../../tera/view/src/render/findAnchor';
import t_add_fragment from '../../../../../tera/view/src/render/addFragment';
import t_apply_props from '../../../../../tera/view/src/render/applyProps';

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
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<h2> <!> </h2>`);
		const t_h2_1 = t_root(t_fragment_0);
		const t_slot_anchor_1 = t_anchor(t_next(t_child(t_h2_1)));
		if ($slots && $slots["_"]) {
			$slots["_"](t_h2_1, t_slot_anchor_1, undefined, $context)
		} else {
			const t_fragment_1 = t_fragment(t_fragments, 1, ` Default header... `);
			const t_text_1 = t_root(t_fragment_1);
			t_add_fragment(t_fragment_1, t_h2_1, t_slot_anchor_1);
		}

		t_apply_props(t_h2_1, $props, []);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Header;
