import { notFound, ok, serverError } from "@tera/kit/response";
import createUserToken from "../../utils/auth/createUserToken";
import userGetPrisma from "../../utils/db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import userViewer from "../../view/userViewer";

/**
 * User controller that gets the current user based on the JWT given.
 * @param req Request with an authenticated user on the auth property.
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function userGet(appData: Record<string, any>) {
	const username = appData.user?.username;
	try {
		// Get current user
		const currentUser = await userGetPrisma(username);
		if (!currentUser) return notFound();

		// Create the authentication token
		const token = await createUserToken(currentUser);

		// Create the user view with the authentication token
		const response = userViewer(currentUser, token);

		return ok(response);
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
