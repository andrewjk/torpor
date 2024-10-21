import { $run } from '@tera/view';
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_attribute } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_root } from '@tera/view';

const Attributes = {
	/**
	 * The component's name.
	 */
	name: "Attributes",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: ParentNode, $anchor: Node | null, $props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		$props ||= {};

		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div data-thing=""> Hello! </div>`);
		const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;

		t_apply_props(t_div_1, $props, ['thing', 'dataThing', 'description']);
		$run(function setAttribute() {
			t_attribute(t_div_1, "thing", $props.thing);
		});
		$run(function setDataAttribute() {
			t_attribute(t_div_1, "data-thing", $props.dataThing);
		});
		$run(function setAttribute() {
			t_attribute(t_div_1, "caption", `this attribute is for ${$props.description}`);
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Attributes;
