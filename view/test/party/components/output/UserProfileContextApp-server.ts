import type SlotRender from "@tera/view";
import UserProfileContext from './UserProfileContext.tera';

const UserProfileContextApp = {
	/**
	 * The component's name.
	 */
	name: "UserProfileContextApp",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		$context = Object.assign({}, $context);

		/* User script */
		const $watch = (obj) => obj;
		const $unwrap = (obj) => obj;
		const $user = $watch({
			id: 1,
			username: "unicorn42",
			email: "unicorn42@example.com",
		});

		// TODO: I think we're supposed to $unwrap this and pass in an update function?
		$context.user = $user;
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <h1>Welcome back, ${t_fmt($user.username)}</h1> `;

		$output += UserProfileContext.render(undefined, $context)
		$output += ` </div>`;
		return $output;
	}
}

export default UserProfileContextApp;
