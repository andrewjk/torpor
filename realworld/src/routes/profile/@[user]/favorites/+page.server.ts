import type { ServerEndPoint } from "@tera/kit";
import { ok } from "@tera/kit/response";
import loadArticles from "../loadArticles";

export default {
	load: async (event) => {
		const { articles, pageCount } = await loadArticles(event, "favorited");
		return ok({ articles, pageCount });
	},
} satisfies ServerEndPoint;
