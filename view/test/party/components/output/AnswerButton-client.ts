import t_fragment from '../../../../../tera/view/src/render/getFragment';
import t_root from '../../../../../tera/view/src/render/nodeRoot';
import t_child from '../../../../../tera/view/src/render/nodeChild';
import t_next from '../../../../../tera/view/src/render/nodeNext';
import t_apply_props from '../../../../../tera/view/src/render/applyProps';
import t_add_fragment from '../../../../../tera/view/src/render/addFragment';

const AnswerButton = {
	name: "AnswerButton",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <button> YES </button> <button> NO </button> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_button_1 = t_next(t_child(t_div_1));
		const t_button_2 = t_next(t_next(t_button_1));

		t_apply_props(t_div_1, $props, ['onYes', 'onNo']);
		t_add_fragment(t_fragment_0, $parent, $anchor);
		t_button_1.addEventListener("click", $props.onYes);
		t_button_2.addEventListener("click", $props.onNo);
	}
}

export default AnswerButton;
