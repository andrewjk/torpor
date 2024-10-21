import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_apply_props } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_root } from "@tera/view";

const HelloWorld = {
	/**
	 * The component's name.
	 */
	name: "HelloWorld",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: ParentNode, $anchor: Node | null, $props?: Record<PropertyKey, any>, $context?: Record<PropertyKey, any>, $slots?: Record<string, SlotRender>) => {
		/* User interface */
		const t_fragments: DocumentFragment[] = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<h1>Hello world</h1>`);
		const t_h1_1 = t_root(t_fragment_0) as HTMLElement;

		t_apply_props(t_h1_1, $props, []);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default HelloWorld;
