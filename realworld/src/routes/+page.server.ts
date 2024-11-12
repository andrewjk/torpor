import * as api from "@/lib/api";
import { pageSize } from "@/lib/constants";
import { type ServerEndPoint } from "@tera/build";
import { ok } from "@tera/build/response";

export default {
	load: async ({ url, appData }) => {
		const user = appData.user;

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
