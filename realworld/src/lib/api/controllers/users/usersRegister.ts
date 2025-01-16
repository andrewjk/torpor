import { created, serverError } from "@torpor/build/response";
import userCreatePrisma from "../../db/user/userCreatePrisma";
import createUserToken from "../../utils/createUserToken";
import getErrorMessage from "../../utils/getErrorMessage";
import { hashPassword } from "../../utils/hashPasswords";
import userView from "../../views/userView";

/**
 * Users controller that registers the user with information given in the body of the request.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function usersRegister(request: Request) {
	const { email, password, username } = (await request.json()).user;
	try {
		// Hash password
		const hashed = hashPassword(password);

		// Create the new user on the database
		const user = await userCreatePrisma(username, email, hashed);

		// Create the authentication token for future use
		const token = await createUserToken(user);

		// Create the user view with the authentication token
		const view = userView(user, token);

		return created(view);
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
