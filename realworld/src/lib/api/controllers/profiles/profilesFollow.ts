import { ok, serverError, unauthorized } from "@tera/build/response";
import userFollowProfilePrisma from "../../db/user/userFollowProfilePrisma";
import userGetPrisma from "../../db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import profileView from "../../views/profileView";

/**
 * Profile controller that adds the username in the parameters to the current user followers list.
 * The parameters of the request must contain the username that will be followed by the authenticated user.
 * @param req Request with authenticated user in the auth property.
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function profilesFollow(
	params: Record<string, string>,
	appData: Record<string, any>,
) {
	const username = params.username;
	const currentUsername = appData.user?.username;
	try {
		// Get current user
		const currentUser = await userGetPrisma(currentUsername);
		if (!currentUser) return unauthorized();

		// Get the user profile to follow
		const profile = await userFollowProfilePrisma(currentUser, username);

		// Create the profile view.
		const view = profileView(profile, currentUser);

		return ok({ profile: view });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
