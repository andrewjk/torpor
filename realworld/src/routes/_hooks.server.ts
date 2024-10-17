// The hooks file runs before layout etc and passes things down the line
/*
export default {
	view: () => {
		return {
			component,
		};
	},
} satisfies ServerHooks;

export function request({ event, resolve }) {
	const jwt = event.cookies.get("jwt");
	event.locals.user = jwt ? JSON.parse(atob(jwt)) : null;

	return resolve(event);
}
*/
