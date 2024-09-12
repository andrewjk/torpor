import FunnyButton from './FunnyButton.tera';
import t_fragment from '../../../../../tera/view/src/render/getFragment';
import t_root from '../../../../../tera/view/src/render/nodeRoot';
import t_child from '../../../../../tera/view/src/render/nodeChild';
import t_next from '../../../../../tera/view/src/render/nodeNext';
import t_anchor from '../../../../../tera/view/src/render/findAnchor';
import t_add_fragment from '../../../../../tera/view/src/render/addFragment';
import t_apply_props from '../../../../../tera/view/src/render/applyProps';

const FunnyButtonApp = {
	name: "FunnyButtonApp",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <!> <!> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_comp_anchor_1 = t_anchor(t_next(t_child(t_div_1)));

		/* @component */

		FunnyButton.render(t_div_1, t_comp_anchor_1, undefined, $context)
		const t_comp_anchor_2 = t_anchor(t_next(t_next(t_comp_anchor_1)));

		/* @component */
		const t_slots_1 = {};
		t_slots_1["_"] = ($sparent, $sanchor, $sprops, $context) => {
			const t_fragment_2 = t_fragment(t_fragments, 2, `Click me!`);
			const t_text_1 = t_root(t_fragment_2);
			t_add_fragment(t_fragment_2, $sparent, $sanchor);
		}

		FunnyButton.render(t_div_1, t_comp_anchor_2, undefined, $context, t_slots_1)

		t_apply_props(t_div_1, $props, []);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default FunnyButtonApp;
