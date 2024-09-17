import t_fragment from '../../../../../tera/view/src/render/getFragment';
import t_root from '../../../../../tera/view/src/render/nodeRoot';
import t_child from '../../../../../tera/view/src/render/nodeChild';
import t_next from '../../../../../tera/view/src/render/nodeNext';
import t_anchor from '../../../../../tera/view/src/render/findAnchor';
import t_run_control from '../../../../../tera/view/src/render/runControl';
import t_run_branch from '../../../../../tera/view/src/render/runControlBranch';
import t_fmt from '../../../../../tera/view/src/render/formatText';
import $run from '../../../../../tera/view/src/$run';
import t_add_fragment from '../../../../../tera/view/src/render/addFragment';
import t_apply_props from '../../../../../tera/view/src/render/applyProps';

const Replace = {
	name: "Replace",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		$props ||= {};

		/* User script */
		let counter = 0;
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <!> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_replace_anchor_1 = t_anchor(t_next(t_child(t_div_1)));

		/* @replace */
		const t_replace_range_1 = {};
		t_run_control(t_replace_range_1, t_replace_anchor_1, (t_before) => {
			$props.name;
			t_run_branch(t_replace_range_1, -1, () => {
				const t_fragment_1 = t_fragment(t_fragments, 1, ` <p>#</p> `);
				const t_root_1 = t_root(t_fragment_1);
				const t_text_1 = t_child(t_next(t_root_1));
				const t_text_2 = t_next(t_next(t_root_1));
				$run(function setTextContent() {
					t_text_1.textContent = `The replace count is ${t_fmt(counter++)}.`;
				});
				t_add_fragment(t_fragment_1, t_div_1, t_before);
				t_next(t_text_2);
			});
		});


		t_apply_props(t_div_1, $props, ['name']);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Replace;
