import type SlotRender from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_root } from '@tera/view';

const SmallTitle = {
	/**
	 * The component's name.
	 */
	name: "SmallTitle",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: Node, $anchor: Node | null, $props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
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
