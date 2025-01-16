import { notFound, ok, serverError } from "@torpor/build/response";
import userUpdatePrisma from "../../db/user/userUpdatePrisma";
import createUserToken from "../../utils/createUserToken";
import getErrorMessage from "../../utils/getErrorMessage";
import userView from "../../views/userView";

/**
 * User controller that updates the current user with info given on the body of the request.
 * @param req Request with authenticated user in the auth property and new information on the body of the request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function userUpdate(appData: Record<string, any>, request: Request) {
	const username = appData.user?.username;
	const info = (await request.json()).user;
	try {
		// Get current user
		const user = await userUpdatePrisma(username, info);
		if (!user) return notFound();

		// Create the user token for future authentications
		const token = await createUserToken(user);

		// Create the user view with the authenticated token
		const view = userView(user, token);

		return ok(view);
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
