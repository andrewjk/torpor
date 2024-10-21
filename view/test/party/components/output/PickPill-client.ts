import { $run } from '@tera/view';
import { $watch } from '@tera/view';
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_event } from '@tera/view';
import { t_fmt } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_root } from '@tera/view';

const PickPill = {
	/**
	 * The component's name.
	 */
	name: "PickPill",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: ParentNode, $anchor: Node | null, $props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		/* User script */
		let $state = $watch({
			picked: "red"
		});
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <div>#</div> <input id="blue-pill" type="radio" value="blue"></input> <label for="blue-pill">Blue pill</label> <input id="red-pill" type="radio" value="red"></input> <label for="red-pill">Red pill</label> </div>`);
		const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
		const t_text_1 = t_child(t_next(t_child(t_div_1)));
		const t_input_1 = t_next(t_next(t_next(t_child(t_div_1)))) as HTMLInputElement;
		const t_input_2 = t_next(t_next(t_next(t_next(t_input_1)))) as HTMLInputElement;

		t_apply_props(t_div_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = `Picked: ${t_fmt($state.picked)}`;
		});
		$run(function setBinding() {
			t_input_1.checked = $state.picked == "blue";
		});
		t_event(t_input_1, "change", (e) => {
			if (e.target.checked) $state.picked = "blue";
		});
		$run(function setBinding() {
			t_input_2.checked = $state.picked == "red";
		});
		t_event(t_input_2, "change", (e) => {
			if (e.target.checked) $state.picked = "red";
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default PickPill;
