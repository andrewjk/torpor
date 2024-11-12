import * as api from "@/lib/api.js";
import type { ServerEndPoint } from "@tera/build";
import { ok, unauthorized, unprocessable } from "@tera/build/response";
import loadArticles from "./loadArticles";

export default {
	load: async (event) => {
		const { articles, pageCount } = await loadArticles(event, "author");
		return ok({ articles, pageCount });
	},
	actions: {
		toggleFollow: async ({ appData, params, request }) => {
			const user = appData.user;
			if (!user) {
				return unauthorized();
			}

			const data = await request.formData();
			const following = data.get("following") !== "on";

			const result = following
				? await api.post(`profiles/${params.user}/follow`, null, user.token)
				: await api.del(`profiles/${params.user}/follow`, user.token);
			if (result.errors) {
				return unprocessable(result);
			}
		},
	},
} satisfies ServerEndPoint;
