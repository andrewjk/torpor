import { $run } from '@tera/view';
import { $watch } from '@tera/view';
import AnswerButton from './AnswerButton.tera';
import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_fmt } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_root } from '@tera/view';

const AnswerButtonApp = {
	name: "AnswerButtonApp",
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
			isHappy: true
		});

		function onAnswerNo() {
			$state.isHappy = false;
		}

		function onAnswerYes() {
			$state.isHappy = true;
		}
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <p>Are you happy?</p> <!> <p style="font-size: 50px;">#</p> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_comp_anchor_1 = t_anchor(t_next(t_next(t_next(t_child(t_div_1)))));

		/* @component */
		const t_props_1 = $watch({});
		$run(function setProp() {
			t_props_1["onYes"] = onAnswerYes;
		});
		$run(function setProp() {
			t_props_1["onNo"] = onAnswerNo;
		});

		AnswerButton.render(t_div_1, t_comp_anchor_1, t_props_1, $context);
		const t_text_1 = t_child(t_next(t_next(t_comp_anchor_1)));

		t_apply_props(t_div_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = t_fmt($state.isHappy ? "😀" : "😥");
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default AnswerButtonApp;
