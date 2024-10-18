import { articlesCreate, articlesList } from "@/lib/api/controllers/articlesController";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	get: ({ url, request }) => {
		return articlesList(url, request);
	},
	post: ({ appData, request }) => {
		return articlesCreate(appData, request);
	},
} satisfies ApiServerEndPoint;
