import { $run } from "@tera/view";
import { $watch } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_apply_props } from "@tera/view";
import { t_child } from "@tera/view";
import { t_fmt } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_root } from "@tera/view";

const Name = {
	/**
	 * The component's name.
	 */
	name: "Name",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: ParentNode, $anchor: Node | null, $props?: Record<PropertyKey, any>, $context?: Record<PropertyKey, any>, $slots?: Record<string, SlotRender>) => {
		/* User script */
		let $state = $watch({
			name: "John"
		});
		
		/* User interface */
		const t_fragments: DocumentFragment[] = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<h1>#</h1>`);
		const t_h1_1 = t_root(t_fragment_0) as HTMLElement;
		const t_text_1 = t_child(t_h1_1);

		t_apply_props(t_h1_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = `Hello ${t_fmt($state.name)}`;
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Name;
