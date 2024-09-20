import type SlotRender from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_event } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_root } from '@tera/view';

const AnswerButton = {
	/**
	 * The component's name.
	 */
	name: "AnswerButton",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: Node, $anchor: Node | null, $props: {
		onYes: Function;
		onNo: Function;
	}, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		$props ||= {};

		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <button> YES </button> <button> NO </button> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_button_1 = t_next(t_child(t_div_1));
		const t_button_2 = t_next(t_next(t_button_1));

		t_apply_props(t_div_1, $props, ['onYes', 'onNo']);
		t_event(t_button_1, "click", $props.onYes);
		t_event(t_button_2, "click", $props.onNo);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default AnswerButton;
