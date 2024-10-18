import { ok, serverError, unauthorized } from "@tera/kit/response";
import articleFeedPrisma from "../../db/article/articleFeedPrisma";
import userGetPrisma from "../../db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import articleView from "../../views/articleView";

function parseQuery(params: URLSearchParams) {
	const query = Object.fromEntries(params.entries());
	return {
		limit: query.limit ? parseInt(query.limit) : undefined,
		offset: query.offset ? parseInt(query.offset) : undefined,
	};
}

/**
 * Article controller that must receive a request with an authenticated user.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesFeed(url: URL, appData: Record<string, any>) {
	const { limit, offset } = parseQuery(url.searchParams);
	const username = appData.user?.username;

	try {
		// Get current user
		const currentUser = await userGetPrisma(username);
		if (!currentUser) return unauthorized();

		// Get articles feed
		const articles = await articleFeedPrisma(currentUser, limit, offset);

		// Create articles feed view
		const articlesFeedView = articles.map((article) =>
			currentUser ? articleView(article, currentUser) : articleView(article),
		);

		return ok({
			articles: articlesFeedView,
			articlesCount: articlesFeedView.length,
		});
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
