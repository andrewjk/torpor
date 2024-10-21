import { $run } from "@tera/view";
import { $watch } from "@tera/view";
import type { SlotRender } from "@tera/view";
import List from './List.tera';
import { t_add_fragment } from "@tera/view";
import { t_anchor } from "@tera/view";
import { t_fmt } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_root } from "@tera/view";

const Let = {
	/**
	 * The component's name.
	 */
	name: "Let",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: ParentNode, $anchor: Node | null, $props?: Record<PropertyKey, any>, $context?: Record<PropertyKey, any>, $slots?: Record<string, SlotRender>) => {
		$props ||= {};

		/* User interface */
		const t_fragments: DocumentFragment[] = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<!>`);
		const t_root_0 = t_root(t_fragment_0);
		const t_comp_anchor_1 = t_anchor(t_root_0) as HTMLElement;

		/* @component */
		const t_props_1 = $watch({});
		$run(function setProp() {
			t_props_1["items"] = $props.items;
		});
		const t_slots_1 = {};
		t_slots_1["_"] = ($sparent: ParentNode, $sanchor: Node | null, $sprops: Record<PropertyKey, any>, $context: Record<PropertyKey, any>) => {
			const t_fragment_2 = t_fragment(t_fragments, 2, `#`);
			const t_text_1 = t_root(t_fragment_2);
			$run(function setTextContent() {
				t_text_1.textContent = ` ${t_fmt($sprops.item.text)} `;
			});
			t_add_fragment(t_fragment_2, $sparent, $sanchor);
		}

		List.render(t_fragment_0, t_comp_anchor_1, t_props_1, $context, t_slots_1);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Let;
