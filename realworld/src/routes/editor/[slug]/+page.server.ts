import * as api from "@/lib/api.js";
import type { PageServerEndPoint } from "@torpor/build";
import { ok, redirect, seeOther, unauthorized, unprocessable } from "@torpor/build/response";

export default {
	load: async ({ appData, params }) => {
		const user = appData.user;
		if (!user) {
			return redirect("/login");
		}

		const { article } = await api.get(`articles/${params.slug}`, user.token);
		return ok({ article });
	},
	actions: {
		default: async ({ appData, params, request }) => {
			const user = appData.user;
			if (!user) {
				return unauthorized();
			}

			const data = await request.formData();

			const result = await api.put(
				`articles/${params.slug}`,
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
