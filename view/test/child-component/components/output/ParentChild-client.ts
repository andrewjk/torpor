import { $run } from '@tera/view';
import { $watch } from '@tera/view';
import { t_add_fragment } from '@tera/view';
import { t_anchor } from '@tera/view';
import { t_apply_props } from '@tera/view';
import { t_child } from '@tera/view';
import { t_fmt } from '@tera/view';
import { t_fragment } from '@tera/view';
import { t_next } from '@tera/view';
import { t_root } from '@tera/view';

const ParentChild = {
	name: "ParentChild",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		$props ||= {};

		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <!> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_comp_anchor_1 = t_anchor(t_next(t_child(t_div_1)));

		/* @component */
		const t_props_1 = $watch({});
		t_props_1["name"] = "Anna";

		Child.render(t_div_1, t_comp_anchor_1, t_props_1, $context);

		t_apply_props(t_div_1, $props, ['name']);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

const Child = {
	name: "Child",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		$props ||= {};

		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<h2>#</h2>`);
		const t_h2_1 = t_root(t_fragment_0);
		const t_text_1 = t_child(t_h2_1);

		t_apply_props(t_h2_1, $props, ['name']);
		$run(function setTextContent() {
			t_text_1.textContent = `Hello, ${t_fmt($props.name)}`;
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default ParentChild;
