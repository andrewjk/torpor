import articlesFeed from "@/lib/api/controllers/articles/articlesFeed";
import { type ServerEndPoint } from "@torpor/build";

export default {
	get: ({ url, request }) => {
		return articlesFeed(url, request);
	},
} satisfies ServerEndPoint;
