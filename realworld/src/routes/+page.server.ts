import * as api from "@/lib/api";
import { pageSize } from "@/lib/constants";
import { type ServerEndPoint } from "@tera/kit";
import { ok } from "@tera/kit/response";

export default {
	load: async ({ url, cookies }) => {
		// TODO: Move this into hooks/middleware
		const jwt = cookies.get("jwt");
		const user = jwt ? JSON.parse(atob(jwt)) : null;

		const tab = url.searchParams.get("tab") || "all";
		const tag = url.searchParams.get("tag");
		const page = +(url.searchParams.get("page") || 1);

		const location = tab === "feed" ? "articles/feed" : "articles";
		const search = new URLSearchParams();

		search.set("limit", pageSize.toString());
		search.set("offset", ((page - 1) * pageSize).toString());
		if (tag) {
			search.set("tag", tag);
		}
		const [{ articles, articlesCount }, { tags }] = await Promise.all([
			api.get(`${location}?${search}`, user?.token),
			api.get("tags"),
		]);

		return ok({
			articles,
			pageCount: Math.ceil(articlesCount / pageSize),
			tags,
		});
	},
} satisfies ServerEndPoint;
