import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_child from '../../../../../tera/view/src/render/internal/nodeChild';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';
import t_anchor from '../../../../../tera/view/src/render/internal/findAnchor';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';

const Article = {
	name: "Article",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<section> <h2> <!> </h2> <!> <!> </section>`);
		const t_section_1 = t_root(t_fragment_0);
		const t_slot_parent_1 = t_next(t_child(t_section_1));
		const t_slot_anchor_1 = t_anchor(t_next(t_child(t_slot_parent_1)));
		if ($slots && $slots["header"]) {
			$slots["header"](t_slot_parent_1, t_slot_anchor_1, undefined, $context)
		}
		const t_slot_anchor_2 = t_anchor(t_next(t_next(t_slot_parent_1)));
		if ($slots && $slots["_"]) {
			$slots["_"](t_section_1, t_slot_anchor_2, undefined, $context)
		}
		const t_slot_anchor_3 = t_anchor(t_next(t_next(t_slot_anchor_2)));
		if ($slots && $slots["footer"]) {
			$slots["footer"](t_section_1, t_slot_anchor_3, undefined, $context)
		}

		t_apply_props(t_section_1, $props, []);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Article;
