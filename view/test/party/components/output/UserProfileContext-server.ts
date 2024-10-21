import type { ServerSlotRender } from "@tera/view";

const UserProfileContext = {
	/**
	 * The component's name.
	 */
	name: "UserProfileContext",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props?: any, $context?: Record<PropertyKey, any>, $slots?: Record<string, ServerSlotRender>) => {
		$context = Object.assign({}, $context);

		/* User script */
		const $watch = (obj: Record<PropertyKey, any>) => obj;
		$context.user = $watch($context.user);
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<div> <h2>My Profile</h2> <p>Username: ${t_fmt($context.user.username)}</p> <p>Email: ${t_fmt($context.user.email)}</p> <button> Update username to Jane </button> </div>`;
		return $output;
	}
}

export default UserProfileContext;
