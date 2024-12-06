import articlesCreate from "@/lib/api/controllers/articles/articlesCreate";
import articlesList from "@/lib/api/controllers/articles/articlesList";
import type { ServerEndPoint } from "@tera/build";

export default {
	get: ({ url, request }) => {
		return articlesList(url, request);
	},
	post: ({ appData, request }) => {
		return articlesCreate(appData, request);
	},
} satisfies ServerEndPoint;
