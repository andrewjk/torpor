import t_fragment from '../../../../../tera/view/src/render/getFragment';
import t_root from '../../../../../tera/view/src/render/nodeRoot';
import t_apply_props from '../../../../../tera/view/src/render/applyProps';
import t_add_fragment from '../../../../../tera/view/src/render/addFragment';

const HelloWorld = {
	name: "HelloWorld",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<h1>Hello world</h1>`);
		const t_h1_1 = t_root(t_fragment_0);

		t_apply_props(t_h1_1, $props, []);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default HelloWorld;
