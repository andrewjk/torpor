import { ok, serverError, unauthorized } from "@tera/kit/response";
import userGetPrisma from "../../utils/db/user/userGetPrisma";
import userUnFollowProfilePrisma from "../../utils/db/user/userUnFollowProfilePrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import profileViewer from "../../view/profileViewer";

/**
 * Profile controller that removes the username in the parameters to the current user followers list.
 * @param req Request with an authenticated user in the auth property
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function unFollowProfile(
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
		const profileView = profileViewer(profile, currentUser);
		return ok({ profile: profileView });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
