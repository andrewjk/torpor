import { ok, serverError } from "@tera/kit/response";
import articlesListPrisma from "../../db/article/articleListPrisma";
import userGetPrisma from "../../db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import articleView from "../../views/articleView";

function parseArticleListQuery(params: URLSearchParams) {
	const query = Object.fromEntries(params.entries());
	return {
		tag: query.tag || undefined,
		author: query.author || undefined,
		favorited: query.favorited || undefined,
		limit: query.limit ? parseInt(query.limit) : undefined,
		offset: query.offset ? parseInt(query.offset) : undefined,
	};
}

/**
 * Article controller that must receive a request.
 * @param req Request with an optional jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesList(url: URL, appData: Record<string, any>) {
	const { tag, author, favorited, limit, offset } = parseArticleListQuery(url.searchParams);
	const username = appData.user?.username;

	try {
		// Get current user
		const currentUser = await userGetPrisma(username);

		// Get the articles
		const articles = await articlesListPrisma(tag, author, favorited, limit, offset);

		// Create articles view
		const view = articles.map((article) =>
			currentUser ? articleView(article, currentUser) : articleView(article),
		);

		return ok({
			articles: view,
			articlesCount: view.length,
		});
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
