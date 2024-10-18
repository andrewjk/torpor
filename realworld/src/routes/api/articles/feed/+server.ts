import articlesFeed from "@/lib/api/controllers/articles/articlesFeed";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	get: ({ url, request }) => {
		return articlesFeed(url, request);
	},
} satisfies ApiServerEndPoint;
