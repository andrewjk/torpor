import type SlotRender from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_range } from '@tera/view';
import { t_root } from '@tera/view';
import { t_run_branch } from '@tera/view';
import { t_run_control } from '@tera/view';

/**
 * A component with a switch statement in it.
 */
const Switch = {
	/**
	 * The component's name.
	 */
	name: "Switch",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: Node, $anchor: Node | null, $props: {
		/** The value to switch on. */
		value: number;
	}, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		$props ||= {};

		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <!> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_switch_anchor_1 = t_anchor(t_next(t_child(t_div_1)));

		/* @switch */
		const t_switch_range_1 = t_range();
		t_run_control(t_switch_range_1, t_switch_anchor_1, (t_before) => {
			switch ($props.value) {
				case 1: {
					t_run_branch(t_switch_range_1, 0, () => {
						const t_fragment_1 = t_fragment(t_fragments, 1, ` <p> A small value. </p> `);
						const t_root_1 = t_root(t_fragment_1);
						const t_text_1 = t_next(t_next(t_root_1));
						t_add_fragment(t_fragment_1, t_div_1, t_before);
						t_next(t_text_1);
					});
					break;
				}
				case 100: {
					t_run_branch(t_switch_range_1, 1, () => {
						const t_fragment_2 = t_fragment(t_fragments, 2, ` <p> A large value. </p> `);
						const t_root_2 = t_root(t_fragment_2);
						const t_text_2 = t_next(t_next(t_root_2));
						t_add_fragment(t_fragment_2, t_div_1, t_before);
						t_next(t_text_2);
					});
					break;
				}
				default: {
					t_run_branch(t_switch_range_1, 2, () => {
						const t_fragment_3 = t_fragment(t_fragments, 3, ` <p> Another value. </p> `);
						const t_root_3 = t_root(t_fragment_3);
						const t_text_3 = t_next(t_next(t_root_3));
						t_add_fragment(t_fragment_3, t_div_1, t_before);
						t_next(t_text_3);
					});
					break;
				}
			}
		});


		t_apply_props(t_div_1, $props, ['value']);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Switch;
