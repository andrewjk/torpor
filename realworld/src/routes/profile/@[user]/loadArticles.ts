import * as api from "@/lib/api.js";
import { pageSize } from "@/lib/constants";
import type { ServerParams } from "@tera/kit";

export default async function loadArticles(
	{ url, params, appData }: ServerParams,
	type: "author" | "favorited",
) {
	const user = appData.user;

	const page = +(url.searchParams.get("page") || 1);

	const search = new URLSearchParams();
	search.set("limit", pageSize.toString());
	search.set("offset", ((page - 1) * pageSize).toString());
	search.set(type, params.user);

	const { articles, articlesCount } = await api.get(`articles?${search}`, user && user.token);

	return {
		articles,
		pageCount: Math.ceil(articlesCount / pageSize),
	};
}
