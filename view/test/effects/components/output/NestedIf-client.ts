import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_root } from '@tera/view';
import { t_run_branch } from '@tera/view';
import { t_run_control } from '@tera/view';

const NestedIf = {
	name: "NestedIf",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <!> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_if_anchor_1 = t_anchor(t_next(t_child(t_div_1)));

		/* @if */
		const t_if_range_1 = {};
		t_run_control(t_if_range_1, t_if_anchor_1, (t_before) => {
			if ($props.condition) {
				t_run_branch(t_if_range_1, 0, () => {
					const t_fragment_1 = t_fragment(t_fragments, 1, ` <!> `);
					const t_root_1 = t_root(t_fragment_1);
					const t_if_anchor_2 = t_anchor(t_next(t_root_1));

					/* @if */
					const t_if_range_2 = {};
					t_run_control(t_if_range_2, t_if_anchor_2, (t_before) => {
						if ($props.counter > 5) {
							t_run_branch(t_if_range_2, 0, () => {
								const t_fragment_2 = t_fragment(t_fragments, 2, ` <p>It's big</p> `);
								const t_root_2 = t_root(t_fragment_2);
								const t_text_1 = t_next(t_next(t_root_2));
								t_add_fragment(t_fragment_2, t_fragment_1, t_before);
								t_next(t_text_1);
							});
						}
						else {
							t_run_branch(t_if_range_2, 1, () => {
								const t_fragment_3 = t_fragment(t_fragments, 3, ` <p>It's small</p> `);
								const t_root_3 = t_root(t_fragment_3);
								const t_text_2 = t_next(t_next(t_root_3));
								t_add_fragment(t_fragment_3, t_fragment_1, t_before);
								t_next(t_text_2);
							});
						}
					});

					const t_text_3 = t_next(t_if_anchor_2);
					t_add_fragment(t_fragment_1, t_div_1, t_before);
					t_next(t_text_3);
				});
			}
			else {
				t_run_branch(t_if_range_1, 1, () => {
				});
			}
		});


		t_apply_props(t_div_1, $props, ['condition', 'counter']);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default NestedIf;
