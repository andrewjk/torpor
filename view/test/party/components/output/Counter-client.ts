import { $run } from '@tera/view';
import { $watch } from '@tera/view';
import type SlotRender from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_event } from '@tera/view';
import { t_fmt } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_root } from '@tera/view';

const Counter = {
	/**
	 * The component's name.
	 */
	name: "Counter",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: Node, $anchor: Node | null, $props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User script */
		let $state = $watch({
			count: 0
		});

		function incrementCount() {
			$state.count++;
		}
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <p>#</p> <button>+1</button> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_text_1 = t_child(t_next(t_child(t_div_1)));
		const t_button_1 = t_next(t_next(t_next(t_child(t_div_1))));

		t_apply_props(t_div_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = `Counter: ${t_fmt($state.count)}`;
		});
		t_event(t_button_1, "click", incrementCount);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Counter;
