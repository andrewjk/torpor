import { forbidden, notFound, ok, serverError } from "@torpor/build/response";
import userGetEmailPrisma from "../../db/user/userGetEmailPrisma";
import createUserToken from "../../utils/createUserToken";
import getErrorMessage from "../../utils/getErrorMessage";
import { compareWithHash } from "../../utils/hashPasswords";
import userView from "../../views/userView";

/**
 * Users controller for the login function sending a valid jwt token in the response if login is successful.
 * @param req Request with a body property body containing a json with user object with name and email as properties.
 * @param res Response
 */
export default async function userLogin(request: Request) {
	const { email, password } = (await request.json()).user;
	try {
		// Get the user with given email
		const user = await userGetEmailPrisma(email);
		if (!user) return notFound();

		// Compare the user password given with the one stored
		console.log(password, user.password);
		if (!compareWithHash(password, user.password)) return forbidden();

		// Create the user token for future authentication
		const token = await createUserToken(user);

		// Create the user view containing the authentication token
		const view = userView(user, token);

		return ok(view);
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
