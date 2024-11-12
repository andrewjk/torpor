import { ok, serverError } from "@tera/build/response";
import commentsGetPrisma from "../../db/comment/commentsGetPrisma";
import userGetPrisma from "../../db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import commentView from "../../views/commentView";

/**
 * Comment controller that must receive a request with an optionally authenticated user.
 * The parameters of the request must have a slug to the article the comment belongs to.
 * @param req Request with an optionally jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function commentsGet(
	params: Record<string, string>,
	appData: Record<string, any>,
) {
	const slug = params.slug;
	const username = appData.user?.username;

	try {
		// Get current user from database
		const currentUser = await userGetPrisma(username);

		// Get comments from database
		const comments = currentUser
			? await commentsGetPrisma(slug, currentUser)
			: await commentsGetPrisma(slug);

		// Create comment view
		const view = comments.map((comment) =>
			currentUser ? commentView(comment, currentUser) : commentView(comment),
		);

		return ok({ comments: view });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
