import UserProfile from './UserProfile.tera';
import t_fragment from '../../../../../tera/view/src/render/getFragment';
import t_root from '../../../../../tera/view/src/render/nodeRoot';
import t_anchor from '../../../../../tera/view/src/render/findAnchor';
import $watch from '../../../../../tera/view/src/$watch';
import $run from '../../../../../tera/view/src/$run';
import t_add_fragment from '../../../../../tera/view/src/render/addFragment';

const UserProfileApp = {
	name: "UserProfileApp",
	/**
	 * @param {Node} $parent
	 * @param {Node | null} $anchor
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($parent, $anchor, $props, $context, $slots) => {
		/* User interface */
		const t_fragments = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<!>`);
		const t_root_0 = t_root(t_fragment_0);
		const t_comp_anchor_1 = t_anchor(t_root_0);

		/* @component */
		const t_props_1 = $watch({});
		t_props_1["name"] = "John";
		$run(function setProp() {
			t_props_1["age"] = 20;
		});
		$run(function setProp() {
			t_props_1["favouriteColors"] = ["green", "blue", "red"];
		});
		t_props_1["isAvailable"] = true;

		UserProfile.render(t_fragment_0, t_comp_anchor_1, t_props_1, $context);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default UserProfileApp;
