import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';

const CssStyle = {
	name: "CssStyle",
	/**
	* @param {Node} $parent
	* @param {Node | null} $anchor
	* @param {Object} [$props]
	* @param {Object} [$slots]
	* @param {Object} [$context]
	*/
	render: ($parent, $anchor, $props, $slots, $context) => {
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <h1 class="title tera-1q0qgpq">I am red</h1> <button style="font-size: 10rem;">I am a button</button> </div>`);
		const t_div_1 = t_root(t_fragment_0);

		t_apply_props(t_div_1, $props, []);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default CssStyle;
