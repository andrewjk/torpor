import { ok, serverError, unauthorized } from "@tera/kit/response";
import commentDeletePrisma from "../../utils/db/comment/commentDeletePrisma";
import userGetPrisma from "../../utils/db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import commentViewer from "../../view/commentViewer";

/**
 * Comment controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug to the article the comment belongs to and the id of the comments that will be removed.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function deleteComment(
	params: Record<string, string>,
	appData: Record<string, any>,
) {
	const slug = params.slug;
	const id = parseInt(params.id);
	const username = appData.user?.username;

	try {
		// Get currentUser
		const currentUser = await userGetPrisma(username);
		if (!currentUser) return unauthorized();

		// Remove comment from database
		const comment = await commentDeletePrisma(slug, id, currentUser);
		if (!comment) return serverError();

		// Create comment view
		const commentView = commentViewer(comment, currentUser);
		return ok({ comment: commentView });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
