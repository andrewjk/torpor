import { notFound, ok, serverError } from "@tera/kit/response";
import userGetPrisma from "../../utils/db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import profileViewer from "../../view/profileViewer";

/**
 * Profile controller that takes the username in the parameters and returns its profile.
 * With an optional authenticated user.
 * @param req Request with an optional authenticated user.
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function getProfile(
	params: Record<string, string>,
	appData: Record<string, any>,
) {
	const username = params.username;
	const currentUsername = appData.user?.username; // The current user's username

	try {
		// Get current user from database
		const currentUser = await userGetPrisma(currentUsername);

		// Get the desired profile
		const profile = await userGetPrisma(username);
		if (!profile) return notFound();

		// Create the profile view
		const profileView = currentUser ? profileViewer(profile, currentUser) : profileViewer(profile);

		return ok({ profile: profileView });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
