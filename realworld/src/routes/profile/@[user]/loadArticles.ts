import * as api from "@/lib/api.js";
import { pageSize } from "@/lib/constants";
import type { ServerParams } from "@tera/kit";

export default async function loadArticles(
	{ url, params, cookies }: ServerParams,
	type: "author" | "favorited",
) {
	// TODO: Move this into hooks/middleware
	const jwt = cookies.get("jwt");
	const user = jwt ? JSON.parse(atob(jwt)) : null;

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
