import articlesFeed from "@/lib/api/controllers/articles/articlesFeed";
import type { ServerEndPoint } from "@tera/build";

export default {
	get: ({ url, request }) => {
		return articlesFeed(url, request);
	},
} satisfies ServerEndPoint;
