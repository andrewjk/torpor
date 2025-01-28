import { type PageServerEndPoint } from "@torpor/build";
import { ok } from "@torpor/build/response";
import loadArticles from "../loadArticles";

export default {
	load: async (event) => {
		const { articles, pageCount } = await loadArticles(event, "favorited");
		return ok({ articles, pageCount });
	},
} satisfies PageServerEndPoint;
