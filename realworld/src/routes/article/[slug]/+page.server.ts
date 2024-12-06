import * as api from "@/lib/api.js";
import type { PageServerEndPoint } from "@tera/build";
import { ok, redirect, unauthorized, unprocessable } from "@tera/build/response";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export default {
	load: async ({ appData, params }) => {
		const user = appData.user;

		const [{ article }, { comments }] = await Promise.all([
			api.get(`articles/${params.slug}`, user?.token),
			api.get(`articles/${params.slug}/comments`, user?.token),
		]);

		const dirty = await marked(article.body);
		article.body = sanitizeHtml(dirty);

		return ok({ article, comments });
	},
	actions: {
		createComment: async ({ appData, params, request }) => {
			const user = appData.user;
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
		deleteComment: async ({ appData, params, url }) => {
			const user = appData.user;
			if (!user) {
				return unauthorized();
			}

			const id = url.searchParams.get("id");
			const result = await api.del(`articles/${params.slug}/comments/${id}`, user.token);
			if (result.errors) {
				return unprocessable(result);
			}
		},
		deleteArticle: async ({ appData, params }) => {
			const user = appData.user;
			if (!user) {
				return unauthorized();
			}

			const result = await api.del(`articles/${params.slug}`, user.token);
			if (result.errors) {
				return unprocessable(result);
			}

			return redirect("/");
		},
		toggleFavorite: async ({ appData, params, request }) => {
			const user = appData.user;
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
} satisfies PageServerEndPoint;
