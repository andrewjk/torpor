import * as api from "@/lib/api.js";
import type { ServerEndPoint } from "@tera/kit";
import { ok, redirect, seeOther, unauthorized, unprocessable } from "@tera/kit/response";

export default {
	load: async ({ cookies, params }) => {
		// TODO: Move this into hooks/middleware
		const jwt = cookies.get("jwt");
		const user = jwt ? JSON.parse(atob(jwt)) : null;
		if (!user) {
			return redirect("/login");
		}

		const { article } = await api.get(`articles/${params.slug}`, user.token);
		return ok({ article });
	},
	actions: {
		default: async ({ cookies, params, request }) => {
			// TODO: Move this into hooks/middleware
			const jwt = cookies.get("jwt");
			const user = jwt ? JSON.parse(atob(jwt)) : null;
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
} satisfies ServerEndPoint;
