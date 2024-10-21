import { $run } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_apply_props } from "@tera/view";
import { t_child } from "@tera/view";
import { t_fmt } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_next } from "@tera/view";
import { t_root } from "@tera/view";

const UserProfile = {
	/**
	 * The component's name.
	 */
	name: "UserProfile",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: ParentNode, $anchor: Node | null, $props?: {
		name: string;
		age: number;
		favouriteColors: string[];
		isAvailable: boolean;
	}, $context?: Record<PropertyKey, any>, $slots?: Record<string, SlotRender>) => {
		$props ||= {};

		/* User interface */
		const t_fragments: DocumentFragment[] = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <p>#</p> <p>#</p> <p>#</p> <p>#</p> </div>`);
		const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
		const t_text_1 = t_child(t_next(t_child(t_div_1)));
		const t_text_2 = t_child(t_next(t_next(t_next(t_child(t_div_1)))));
		const t_text_3 = t_child(t_next(t_next(t_next(t_next(t_next(t_child(t_div_1)))))));
		const t_text_4 = t_child(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_child(t_div_1)))))))));

		t_apply_props(t_div_1, $props, ['name', 'age', 'favouriteColors', 'isAvailable']);
		$run(function setTextContent() {
			t_text_1.textContent = `My name is ${t_fmt($props.name)}!`;
		});
		$run(function setTextContent() {
			t_text_2.textContent = `My age is ${t_fmt($props.age)}!`;
		});
		$run(function setTextContent() {
			t_text_3.textContent = `My favourite colors are ${t_fmt($props.favouriteColors.join(", "))}!`;
		});
		$run(function setTextContent() {
			t_text_4.textContent = `I am ${t_fmt($props.isAvailable ? "available" : "not available")}`;
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default UserProfile;
