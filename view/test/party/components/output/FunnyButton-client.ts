import type SlotRender from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_root } from '@tera/view';

const FunnyButton = {
	/**
	 * The component's name.
	 */
	name: "FunnyButton",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<button style=" background: rgba(0, 0, 0, 0.4); color: #fff; padding: 10px 20px; font-size: 30px; border: 2px solid #fff; margin: 8px; transform: scale(0.9); box-shadow: 4px 4px rgba(0, 0, 0, 0.4); transition: transform 0.2s cubic-bezier(0.34, 1.65, 0.88, 0.925) 0s; outline: 0; "> <!> </button>`);
		const t_button_1 = t_root(t_fragment_0);
		const t_slot_anchor_1 = t_anchor(t_next(t_child(t_button_1)));
		if ($slots && $slots["_"]) {
			$slots["_"](t_button_1, t_slot_anchor_1, undefined, $context)
		} else {
			const t_fragment_1 = t_fragment(t_fragments, 1, ` <span>No content found</span> `);
			const t_root_1 = t_root(t_fragment_1);
			const t_text_1 = t_next(t_next(t_root_1));
			t_add_fragment(t_fragment_1, t_button_1, t_slot_anchor_1);
			t_next(t_text_1);
		}

		t_apply_props(t_button_1, $props, []);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default FunnyButton;
