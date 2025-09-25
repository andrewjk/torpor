import * as api from "@/lib/api.js";
import { type PageServerEndPoint } from "@torpor/build";
import { seeOther, temporaryRedirect, unauthorized, unprocessable } from "@torpor/build/response";

export default {
	load: async ({ appData }) => {
		const user = appData.user;
		if (!user) {
			return temporaryRedirect("/login");
		}
	},
	actions: {
		default: async ({ appData, request }) => {
			const user = appData.user;
			if (!user) {
				return unauthorized();
			}

			const data = await request.formData();

			const result = await api.post(
				"articles",
				{
					article: {
						title: data.get("title"),
						description: data.get("description"),
						body: data.get("body"),
						tagList: data.getAll("tag"),
					},
				},
				user.token,
			);
			if (result.errors) {
				return unprocessable(result);
			}

			return seeOther(`/article/${result.article.slug}`);
		},
	},
} satisfies PageServerEndPoint;
