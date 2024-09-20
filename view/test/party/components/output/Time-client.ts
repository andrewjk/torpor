import { $run } from '@tera/view';
import { $watch } from '@tera/view';
import type SlotRender from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_fmt } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_root } from '@tera/view';

const Time = {
	/**
	 * The component's name.
	 */
	name: "Time",
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
			time: new Date().toLocaleTimeString()
		});

		$run(() => {
			const timer = setInterval(() => {
				$state.time = new Date().toLocaleTimeString();
			}, 1000);

			return () => clearInterval(timer);
		});
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<p>#</p>`);
		const t_p_1 = t_root(t_fragment_0);
		const t_text_1 = t_child(t_p_1);

		t_apply_props(t_p_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = `Current time: ${t_fmt($state.time)}`;
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Time;
