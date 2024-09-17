import UserProfileContext from './UserProfileContext.tera';
import $watch from '../../../../../tera/view/src/$watch';
import $unwrap from '../../../../../tera/view/src/$unwrap';
import t_fragment from '../../../../../tera/view/src/render/getFragment';
import t_root from '../../../../../tera/view/src/render/nodeRoot';
import t_child from '../../../../../tera/view/src/render/nodeChild';
import t_next from '../../../../../tera/view/src/render/nodeNext';
import t_anchor from '../../../../../tera/view/src/render/findAnchor';
import t_apply_props from '../../../../../tera/view/src/render/applyProps';
import t_fmt from '../../../../../tera/view/src/render/formatText';
import $run from '../../../../../tera/view/src/$run';
import t_add_fragment from '../../../../../tera/view/src/render/addFragment';

const UserProfileContextApp = {
	name: "UserProfileContextApp",
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
		const $user = $watch({
			id: 1,
			username: "unicorn42",
			email: "unicorn42@example.com",
		});

		// TODO: I think we're supposed to $unwrap this and pass in an update function?
		$context.user = $user;
		
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div> <h1>#</h1> <!> </div>`);
		const t_div_1 = t_root(t_fragment_0);
		const t_text_1 = t_child(t_next(t_child(t_div_1)));
		const t_comp_anchor_1 = t_anchor(t_next(t_next(t_next(t_child(t_div_1)))));

		/* @component */

		UserProfileContext.render(t_div_1, t_comp_anchor_1, undefined, $context);

		t_apply_props(t_div_1, $props, []);
		$run(function setTextContent() {
			t_text_1.textContent = `Welcome back, ${t_fmt($user.username)}`;
		});
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default UserProfileContextApp;
