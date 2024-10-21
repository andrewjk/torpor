import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_anchor } from "@tera/view";
import { t_apply_props } from "@tera/view";
import { t_child } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_next } from "@tera/view";
import { t_range } from "@tera/view";
import { t_root } from "@tera/view";
import { t_run_branch } from "@tera/view";
import { t_run_control } from "@tera/view";

const Html = {
	/**
	 * The component's name.
	 */
	name: "Html",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<p> <!></p>`);
		const t_p_1 = t_root(t_fragment_0) as HTMLElement;
		const t_html_anchor_1 = t_anchor(t_next(t_child(t_p_1))) as HTMLElement;

		/* @html */
		const t_html_range_1 = t_range();
		t_run_control(t_html_range_1, t_html_anchor_1, (t_before) => {
			t_run_branch(t_html_range_1, -1, () => {
				const t_template_1 = document.createElement("template");
				t_template_1.innerHTML = $props.html;
				let t_fragment_1 = t_template_1.content.cloneNode(true) as DocumentFragment;
				t_add_fragment(t_fragment_1, t_p_1, t_before);
			});
		});


		t_apply_props(t_p_1, $props, ['html']);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Html;
