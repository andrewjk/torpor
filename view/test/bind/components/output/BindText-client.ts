import $watch from '../../../../../tera/view/src/watch/$watch';
import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_child from '../../../../../tera/view/src/render/internal/nodeChild';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import $run from '../../../../../tera/view/src/watch/$run';
import t_fmt from '../../../../../tera/view/src/render/internal/formatText';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';

const BindText = {
	name: "BindText",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		/* User script */
		let $state = $watch({ name: "Alice" });
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <input></input> <p>#</p> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_input_1 = t_next(t_child(t_div_1));
		const t_text_1 = t_child(t_next(t_next(t_input_1)));

		t_apply_props(t_div_1, $props, []);
		$run(function setBinding() {
			t_input_1.value = $state.name || "";
		});
		t_input_1.addEventListener("input", (e) => $state.name = e.target.value);
		$run(function setTextContent() {
			t_text_1.textContent = `Hello, ${t_fmt($state.name)}`;
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default BindText;
