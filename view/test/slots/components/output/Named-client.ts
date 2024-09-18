import Article from './Article.tera';
import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_root } from '@tera/view';

const Named = {
	name: "Named",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<!>`);
		const t_root_0 = t_root(t_fragment_0);
		const t_comp_anchor_1 = t_anchor(t_root_0);

		/* @component */
		const t_slots_1 = {};
		t_slots_1["_"] = ($sparent, $sanchor, $sprops, $context) => {
			const t_fragment_2 = t_fragment(t_fragments, 2, ` <p> The article's body </p> `);
			const t_root_2 = t_root(t_fragment_2);
			const t_text_1 = t_next(t_next(t_root_2));
			t_add_fragment(t_fragment_2, $sparent, $sanchor);
			t_next(t_text_1);
		}
		t_slots_1["header"] = ($sparent, $sanchor, $sprops, $context) => {
			const t_fragment_3 = t_fragment(t_fragments, 3, ` The article's header `);
			const t_text_2 = t_root(t_fragment_3);
			t_add_fragment(t_fragment_3, $sparent, $sanchor);
		}

		Article.render(t_fragment_0, t_comp_anchor_1, undefined, $context, t_slots_1);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Named;
