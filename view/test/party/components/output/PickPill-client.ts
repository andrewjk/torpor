import $watch from '../../../../../tera/view/src/watch/$watch';
import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_child from '../../../../../tera/view/src/render/internal/nodeChild';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import t_fmt from '../../../../../tera/view/src/render/internal/formatText';
import $run from '../../../../../tera/view/src/watch/$run';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';

const PickPill = {
	name: "PickPill",
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
			picked: "red"
		});
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <div>#</div> <input id="blue-pill" type="radio" value="blue"></input> <label for="blue-pill">Blue pill</label> <input id="red-pill" type="radio" value="red"></input> <label for="red-pill">Red pill</label> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_text_1 = t_child(t_next(t_child(t_div_1)));
		const t_input_1 = t_next(t_next(t_next(t_child(t_div_1))));
		const t_input_2 = t_next(t_next(t_next(t_next(t_input_1))));

		t_apply_props(t_div_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = `Picked: ${t_fmt($state.picked)}`;
		});
		$run(function setBinding() {
			t_input_1.checked = $state.picked == "blue";
		});
		t_input_1.addEventListener("change", (e) => {
			if (e.target.checked) $state.picked = "blue";
		});
		$run(function setBinding() {
			t_input_2.checked = $state.picked == "red";
		});
		t_input_2.addEventListener("change", (e) => {
			if (e.target.checked) $state.picked = "red";
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default PickPill;
