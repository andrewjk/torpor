import $watch from '../../../../../tera/view/src/$watch';
import t_fragment from '../../../../../tera/view/src/render/getFragment';
import t_root from '../../../../../tera/view/src/render/nodeRoot';
import t_child from '../../../../../tera/view/src/render/nodeChild';
import t_next from '../../../../../tera/view/src/render/nodeNext';
import t_apply_props from '../../../../../tera/view/src/render/applyProps';
import t_fmt from '../../../../../tera/view/src/render/formatText';
import $run from '../../../../../tera/view/src/$run';
import t_event from '../../../../../tera/view/src/render/addEvent';
import t_add_fragment from '../../../../../tera/view/src/render/addFragment';

const UserProfileContext = {
	name: "UserProfileContext",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		$context = Object.assign({}, $context);

		/* User script */
		$context.user = $watch($context.user);
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <h2>My Profile</h2> <p>#</p> <p>#</p> <button> Update username to Jane </button> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_text_1 = t_child(t_next(t_next(t_next(t_child(t_div_1)))));
		const t_text_2 = t_child(t_next(t_next(t_next(t_next(t_next(t_child(t_div_1)))))));
		const t_button_1 = t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_child(t_div_1))))))));

		t_apply_props(t_div_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = `Username: ${t_fmt($context.user.username)}`;
		});
		$run(function setTextContent() {
			t_text_2.textContent = `Email: ${t_fmt($context.user.email)}`;
		});
		t_event(t_button_1, "click", () => ($context.user.username = "Jane"));
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default UserProfileContext;
