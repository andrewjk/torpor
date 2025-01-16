import { notFound, ok, serverError, unauthorized } from "@torpor/build/response";
import articleUnFavoritePrisma from "../../db/article/articleUnFavoritePrisma";
import userGetPrisma from "../../db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import articleView from "../../views/articleView";

/**
 * Article controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesUnFavorite(
	params: Record<string, string>,
	appData: Record<string, any>,
) {
	const slug = params.slug;
	const username = appData.user?.username;

	try {
		// Get current user
		let currentUser = await userGetPrisma(username);
		if (!currentUser) return unauthorized();

		// UnFavorite the article
		const article = await articleUnFavoritePrisma(currentUser, slug);
		if (!article) return notFound();

		// Retrieve current user after update of its favorited articles
		currentUser = await userGetPrisma(username);
		if (!currentUser) return serverError(); // The user should not have disappeared after having un-favorited an article

		// Create article view
		const view = articleView(article, currentUser);
		return ok({ article: view });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
