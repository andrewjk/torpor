import { created, serverError, unauthorized } from "@tera/kit/response";
import commentCreatePrisma from "../../utils/db/comment/commentCreatePrisma";
import userGetPrisma from "../../utils/db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import commentViewer from "../../view/commentViewer";

/**
 * Comment controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug to the article the comment belongs to.
 * The body of the request must have an comment object with a body string.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function createComment(
	params: Record<string, string>,
	appData: Record<string, any>,
	request: Request,
) {
	const slug = params.slug;
	const { body: commentContent } = (await request.json()).comment;
	const username = appData.user?.username;

	try {
		// Get currentUser
		const currentUser = await userGetPrisma(username);
		if (!currentUser) return unauthorized();

		// Add comment to database
		const comment = await commentCreatePrisma(slug, commentContent, currentUser);

		// Create comment view
		const commentView = commentViewer(comment, currentUser);
		return created({ comment: commentView });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
