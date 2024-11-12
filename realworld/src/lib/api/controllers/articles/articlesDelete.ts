import { ok, serverError, unauthorized } from "@tera/build/response";
import articleDeletePrisma from "../../db/article/articleDeletePrisma";
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
export default async function articlesDelete(
	params: Record<string, string>,
	appData: Record<string, any>,
) {
	const slug = params.slug;
	const username = appData.user?.username;

	try {
		// Get current user
		const currentUser = await userGetPrisma(username);
		if (!currentUser) return unauthorized();

		// Delete the article
		const article = await articleDeletePrisma(slug);

		// Create the deleted article view
		const view = articleView(article, currentUser);
		return ok({ article: view });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
