import type { PageServerEndPoint } from "@tera/build";
import { ok } from "@tera/build/response";
import loadArticles from "../loadArticles";

export default {
	load: async (event) => {
		const { articles, pageCount } = await loadArticles(event, "favorited");
		return ok({ articles, pageCount });
	},
} satisfies PageServerEndPoint;
