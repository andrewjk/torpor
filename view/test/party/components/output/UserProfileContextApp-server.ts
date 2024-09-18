import UserProfileContext from './UserProfileContext.tera';

const UserProfileContextApp = {
	name: "UserProfileContextApp",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
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
