import { $mount } from '@tera/view';
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_flush } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_root } from '@tera/view';

const Mount = {
	/**
	 * The component's name.
	 */
	name: "Mount",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: ParentNode, $anchor: Node | null, $props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User script */
		let inputElement;

		$mount(() => {
			inputElement.value = "hi";
		});
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<input></input>`);
		const t_input_1 = t_root(t_fragment_0) as HTMLInputElement;

		t_apply_props(t_input_1, $props, []);
		inputElement = t_input_1;
		t_add_fragment(t_fragment_0, $parent, $anchor);

		t_flush();
	}
}

export default Mount;
