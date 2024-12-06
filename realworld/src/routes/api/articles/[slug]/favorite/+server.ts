import articlesFavorite from "@/lib/api/controllers/articles/articlesFavorite";
import articlesUnFavorite from "@/lib/api/controllers/articles/articlesUnFavorite";
import type { ServerEndPoint } from "@tera/build";

export default {
	post: ({ params, appData }) => {
		return articlesFavorite(params, appData);
	},
	del: ({ params, request }) => {
		return articlesUnFavorite(params, request);
	},
} satisfies ServerEndPoint;
