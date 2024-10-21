import { $run } from '@tera/view';
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_root } from '@tera/view';

const Class = {
	/**
	 * The component's name.
	 */
	name: "Class",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div class="hello"> Hello! </div>`);
		const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;

		t_apply_props(t_div_1, $props, ['red', 'green', 'blue']);
		$run(function setClassList() {
			t_div_1.classList.toggle("red", $props.red);
		});
		$run(function setClassList() {
			t_div_1.classList.toggle("green", $props.green);
		});
		$run(function setClassList() {
			t_div_1.classList.toggle("blue", $props.blue);
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Class;
