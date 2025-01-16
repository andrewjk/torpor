import { ok, serverError, unauthorized } from "@torpor/build/response";
import userGetPrisma from "../../db/user/userGetPrisma";
import userUnFollowProfilePrisma from "../../db/user/userUnFollowProfilePrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import profileView from "../../views/profileView";

/**
 * Profile controller that removes the username in the parameters to the current user followers list.
 * @param req Request with an authenticated user in the auth property
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function profilesUnFollow(
	params: Record<string, string>,
	appData: Record<string, any>,
) {
	const username = params.username;
	const currentUsername = appData.user?.username;

	try {
		// Get current user
		const currentUser = await userGetPrisma(currentUsername);
		if (!currentUser) return unauthorized();

		// Get the desired profile
		const profile = await userUnFollowProfilePrisma(currentUser, username);

		// Create the profile view
		const view = profileView(profile, currentUser);
		return ok({ profile: view });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
