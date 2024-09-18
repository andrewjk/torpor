import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_root } from '@tera/view';

const SmallTitle = {
	name: "SmallTitle",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<h6> <!> </h6>`);
		const t_h6_1 = t_root(t_fragment_0);
		const t_slot_anchor_1 = t_anchor(t_next(t_child(t_h6_1)));
		if ($slots && $slots["_"]) {
			$slots["_"](t_h6_1, t_slot_anchor_1, undefined, $context)
		}

		t_apply_props(t_h6_1, $props, []);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default SmallTitle;
