import type { ServerEndPoint } from "@tera/kit";
import { ok } from "@tera/kit/response";

export default {
	load: ({ appData }) => {
		const user = appData.user;
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
