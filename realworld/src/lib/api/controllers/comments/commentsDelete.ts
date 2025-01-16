import { ok, serverError, unauthorized } from "@torpor/build/response";
import commentDeletePrisma from "../../db/comment/commentDeletePrisma";
import userGetPrisma from "../../db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import commentView from "../../views/commentView";

/**
 * Comment controller that must receive a request with an authenticated user.
 * The parameters of the request must have a slug to the article the comment belongs to and the id of the comments that will be removed.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function commentsDelete(
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
		const view = commentView(comment, currentUser);
		return ok({ comment: view });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
