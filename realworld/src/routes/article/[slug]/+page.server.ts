import * as api from "@/lib/api.js";
import type { ServerEndPoint } from "@tera/kit";
import { ok, redirect, unauthorized, unprocessable } from "@tera/kit/response";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export default {
	load: async ({ cookies, params }) => {
		// TODO: Move this into hooks/middleware
		const jwt = cookies.get("jwt");
		const user = jwt ? JSON.parse(atob(jwt)) : null;

		const [{ article }, { comments }] = await Promise.all([
			api.get(`articles/${params.slug}`, user?.token),
			api.get(`articles/${params.slug}/comments`, user?.token),
		]);

		const dirty = await marked(article.body);
		article.body = sanitizeHtml(dirty);

		return ok({ article, comments });
	},
	actions: {
		createComment: async ({ cookies, params, request }) => {
			// TODO: Move this into hooks/middleware
			const jwt = cookies.get("jwt");
			const user = jwt ? JSON.parse(atob(jwt)) : null;
			if (!user) {
				return unauthorized();
			}

			const data = await request.formData();

			const result = await api.post(
				`articles/${params.slug}/comments`,
				{
					comment: {
						body: data.get("comment"),
					},
				},
				user.token,
			);
			if (result.errors) {
				return unprocessable(result);
			}
		},
		deleteComment: async ({ cookies, params, url }) => {
			// TODO: Move this into hooks/middleware
			const jwt = cookies.get("jwt");
			const user = jwt ? JSON.parse(atob(jwt)) : null;
			if (!user) {
				return unauthorized();
			}

			const id = url.searchParams.get("id");
			const result = await api.del(`articles/${params.slug}/comments/${id}`, user.token);
			if (result.errors) {
				return unprocessable(result);
			}
		},
		deleteArticle: async ({ cookies, params }) => {
			// TODO: Move this into hooks/middleware
			const jwt = cookies.get("jwt");
			const user = jwt ? JSON.parse(atob(jwt)) : null;
			if (!user) {
				return unauthorized();
			}

			const result = await api.del(`articles/${params.slug}`, user.token);
			if (result.errors) {
				return unprocessable(result);
			}

			return redirect("/");
		},
		toggleFavorite: async ({ cookies, params, request }) => {
			// TODO: Move this into hooks/middleware
			const jwt = cookies.get("jwt");
			const user = jwt ? JSON.parse(atob(jwt)) : null;
			if (!user) {
				return unauthorized();
			}

			const data = await request.formData();
			const favorited = data.get("favorited") !== "on";

			if (favorited) {
				const result = await api.post(`articles/${params.slug}/favorite`, null, user.token);
				if (result.errors) {
					return unprocessable(result);
				}
			} else {
				const result = await api.del(`articles/${params.slug}/favorite`, user.token);
				if (result.errors) {
					return unprocessable(result);
				}
			}

			return redirect(request.headers.get("referer") ?? `/article/${params.slug}`);
		},
	},
} satisfies ServerEndPoint;
