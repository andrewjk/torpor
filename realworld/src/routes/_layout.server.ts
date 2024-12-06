import type { PageServerEndPoint } from "@tera/build";
import { ok } from "@tera/build/response";

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
} satisfies PageServerEndPoint;
