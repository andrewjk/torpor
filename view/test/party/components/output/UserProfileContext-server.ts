const UserProfileContext = {
	name: "UserProfileContext",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		$context = Object.assign({}, $context);

		/* User script */
		const $watch = (obj) => obj;
		$context.user = $watch($context.user);
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <h2>My Profile</h2> <p>Username: ${t_fmt($context.user.username)}</p> <p>Email: ${t_fmt($context.user.email)}</p> <button> Update username to Jane </button> </div>`;
		return $output;
	}
}

export default UserProfileContext;
