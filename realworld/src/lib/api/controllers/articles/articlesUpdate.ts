import { Article } from "@prisma/client";
import { ok, serverError, unauthorized } from "@torpor/build/response";
import articleUpdatePrisma from "../../db/article/articleUpdatePrisma";
import userGetPrisma from "../../db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import articleView from "../../views/articleView";

/**
 * Article controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug.
 * The body of the request must have an article object with title, description and body.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesUpdate(
	params: Record<string, string>,
	appData: Record<string, any>,
	request: Request,
) {
	const slug = params.slug;
	const { title, description, body }: Article = (await request.json()).article;
	const userName = appData.user?.username;

	try {
		// Get current user
		const currentUser = await userGetPrisma(userName);
		if (!currentUser) return unauthorized();

		// Update the article
		const article = await articleUpdatePrisma(slug, {
			title,
			description,
			body,
		});

		// Create the article view
		const view = articleView(article, currentUser);
		return ok({ article: view });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
