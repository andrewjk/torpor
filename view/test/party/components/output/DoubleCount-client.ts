import $watch from '../../../../../tera/view/src/$watch';
import t_fragment from '../../../../../tera/view/src/render/getFragment';
import t_root from '../../../../../tera/view/src/render/nodeRoot';
import t_child from '../../../../../tera/view/src/render/nodeChild';
import t_apply_props from '../../../../../tera/view/src/render/applyProps';
import t_fmt from '../../../../../tera/view/src/render/formatText';
import $run from '../../../../../tera/view/src/$run';
import t_add_fragment from '../../../../../tera/view/src/render/addFragment';

const DoubleCount = {
	name: "DoubleCount",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		/* User script */
		let $state = $watch({
			count: 10,
			get doubleCount() {
				return this.count * 2;
			}
		});
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div>#</div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_text_1 = t_child(t_div_1);

		t_apply_props(t_div_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = t_fmt($state.doubleCount);
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default DoubleCount;
