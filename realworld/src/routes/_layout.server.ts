import type { ServerEndPoint } from "@tera/kit";
import { ok } from "@tera/kit/response";

export default {
	load: ({ cookies }) => {
		// TODO: Move this into hooks/middleware
		const jwt = cookies.get("jwt");
		const user = jwt ? JSON.parse(atob(jwt)) : null;
		return ok({
			user: user && {
				username: user.username,
				email: user.email,
				image: user.image,
				bio: user.bio,
			},
		});
	},
} satisfies ServerEndPoint;
