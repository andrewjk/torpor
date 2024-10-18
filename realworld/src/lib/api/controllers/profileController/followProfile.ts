import { ok, serverError, unauthorized } from "@tera/kit/response";
import userFollowProfilePrisma from "../../utils/db/user/userFollowProfilePrisma";
import userGetPrisma from "../../utils/db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import profileViewer from "../../view/profileViewer";

/**
 * Profile controller that adds the username in the parameters to the current user followers list.
 * The parameters of the request must contain the username that will be followed by the authenticated user.
 * @param req Request with authenticated user in the auth property.
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function followProfile(
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
		const profileView = profileViewer(profile, currentUser);

		return ok({ profile: profileView });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
