import Header from './Header.tera';
import type SlotRender from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_root } from '@tera/view';

const Basic = {
	/**
	 * The component's name.
	 */
	name: "Basic",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<!>`);
		const t_root_0 = t_root(t_fragment_0);
		const t_comp_anchor_1 = t_anchor(t_root_0);

		/* @component */
		const t_slots_1 = {};
		t_slots_1["_"] = ($sparent, $sanchor, $sprops, $context) => {
			const t_fragment_2 = t_fragment(t_fragments, 2, ` Basic stuff `);
			const t_text_1 = t_root(t_fragment_2);
			t_add_fragment(t_fragment_2, $sparent, $sanchor);
		}

		Header.render(t_fragment_0, t_comp_anchor_1, undefined, $context, t_slots_1);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Basic;
