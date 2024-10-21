import FunnyButton from './FunnyButton.tera';
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_root } from '@tera/view';

const FunnyButtonApp = {
	/**
	 * The component's name.
	 */
	name: "FunnyButtonApp",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: ParentNode, $anchor: Node | null, $props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <!> <!> </div>`);
		const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
		const t_comp_anchor_1 = t_anchor(t_next(t_child(t_div_1))) as HTMLElement;

		/* @component */

		FunnyButton.render(t_div_1, t_comp_anchor_1, undefined, $context);
		const t_comp_anchor_2 = t_anchor(t_next(t_next(t_comp_anchor_1))) as HTMLElement;

		/* @component */
		const t_slots_1 = {};
		t_slots_1["_"] = ($sparent, $sanchor, $sprops, $context) => {
			const t_fragment_2 = t_fragment(t_fragments, 2, `Click me!`);
			const t_text_1 = t_root(t_fragment_2);
			t_add_fragment(t_fragment_2, $sparent, $sanchor);
		}

		FunnyButton.render(t_div_1, t_comp_anchor_2, undefined, $context, t_slots_1);

		t_apply_props(t_div_1, $props, []);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default FunnyButtonApp;
