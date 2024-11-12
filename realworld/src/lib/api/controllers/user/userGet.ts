import { notFound, ok, serverError } from "@tera/build/response";
import userGetPrisma from "../../db/user/userGetPrisma";
import createUserToken from "../../utils/createUserToken";
import getErrorMessage from "../../utils/getErrorMessage";
import userView from "../../views/userView";

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
		const response = userView(currentUser, token);

		return ok(response);
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
