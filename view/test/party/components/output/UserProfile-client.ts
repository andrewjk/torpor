import t_fragment from '../../../../../tera/view/src/render/internal/getFragment';
import t_root from '../../../../../tera/view/src/render/internal/nodeRoot';
import t_child from '../../../../../tera/view/src/render/internal/nodeChild';
import t_next from '../../../../../tera/view/src/render/internal/nodeNext';
import t_apply_props from '../../../../../tera/view/src/render/internal/applyProps';
import t_fmt from '../../../../../tera/view/src/render/internal/formatText';
import $run from '../../../../../tera/view/src/watch/$run';
import t_add_fragment from '../../../../../tera/view/src/render/internal/addFragment';

const UserProfile = {
	name: "UserProfile",
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

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <p>#</p> <p>#</p> <p>#</p> <p>#</p> </div>`);
		const t_div_1 = t_root(t_fragment_0);
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
