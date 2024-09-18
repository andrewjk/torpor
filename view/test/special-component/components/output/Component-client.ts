import { $watch } from '@tera/view';
import BigTitle from './BigTitle.tera';
import SmallTitle from './SmallTitle.tera';
import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_root } from '@tera/view';
import { t_run_branch } from '@tera/view';
import { t_run_control } from '@tera/view';

const Component = {
	name: "Component",
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
		let components = {
			BigTitle,
			SmallTitle
		};
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<!>`);
		const t_replace_anchor_1 = t_anchor(t_root(t_fragment_0));

		/* @replace */
		const t_replace_range_1 = {};
		t_run_control(t_replace_range_1, t_replace_anchor_1, (t_before) => {
			components[$props.self];
			t_run_branch(t_replace_range_1, -1, () => {
				const t_fragment_1 = t_fragment(t_fragments, 1, `<!>`);
				const t_root_1 = t_root(t_fragment_1);
				const t_comp_anchor_1 = t_anchor(t_root_1);

				/* @component */
				const t_props_1 = $watch({});
				const t_slots_1 = {};
				t_slots_1["_"] = ($sparent, $sanchor, $sprops, $context) => {
					const t_fragment_3 = t_fragment(t_fragments, 3, ` Hello! `);
					const t_text_1 = t_root(t_fragment_3);
					t_add_fragment(t_fragment_3, $sparent, $sanchor);
				}

				components[$props.self].render(t_fragment_1, t_comp_anchor_1, t_props_1, $context, t_slots_1);
				t_add_fragment(t_fragment_1, t_fragment_0, t_before);
			});
		});

		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Component;
