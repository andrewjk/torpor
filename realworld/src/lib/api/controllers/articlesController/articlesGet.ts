import { notFound, ok, serverError } from "@tera/kit/response";
import articleGetPrisma from "../../utils/db/article/articleGetPrisma";
import userGetPrisma from "../../utils/db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import articleViewer from "../../view/articleViewer";

/**
 * Article controller that must receive a request.
 * The parameters of the request must have a slug.
 * @param req Request with a an optional jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesGet(
	params: Record<string, string>,
	appData: Record<string, any>,
) {
	const slug = params.slug;
	const username = appData.user?.username;

	try {
		// Get current user
		const currentUser = await userGetPrisma(username);

		// Get the article
		const article = await articleGetPrisma(slug);
		if (!article) return notFound();

		// Create the article view
		const articleView = currentUser ? articleViewer(article, currentUser) : articleViewer(article);
		return ok({ article: articleView });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
