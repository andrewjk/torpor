import { type PageServerEndPoint } from "@torpor/build";
import { temporaryRedirect } from "@torpor/build/response";

export default {
	load: async ({ cookies }) => {
		// This was coming from parent for some reason?
		// TODO: Move this into hooks/middleware
		const jwt = cookies.get("jwt");
		const user = jwt ? JSON.parse(atob(jwt)) : null;
		return temporaryRedirect(user ? `/profile/@${user.username}` : "/login");
	},
} satisfies PageServerEndPoint;
