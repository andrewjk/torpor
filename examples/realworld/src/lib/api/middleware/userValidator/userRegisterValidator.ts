import { badRequest } from "@torpor/build/response";
import { ValidationError } from "../../utils/ValidationError";

/**
 * This function is a middleware that validates the user information in the request in order to log the user.
 * If the request is malformed it responds accordingly and returns, stopping the flow of the express.
 * If the request is well formed, it passes control to the next handler.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function userRegisterValidator(request: Request) {
	const errors: ValidationError = {};
	errors.body = [];
	if (!request.body) {
		errors.body.push("can't be empty");
		return badRequest({ errors });
	}

	const { user } = request.body;
	if (!user) {
		errors.body.push("user object must be defined");
		return badRequest({ errors });
	}

	const { password, email, username } = user;
	if (!password) {
		errors.body.push("password property in user can't be empty");
	} else if (typeof password != "string") {
		errors.body.push("password property in user must be a string");
	}

	if (!email) {
		errors.body.push("email property in user can't be empty");
	} else if (typeof email != "string") {
		errors.body.push("email property in user must be a string");
	}

	if (!username) {
		errors.body.push("username property in user can't be empty");
	} else if (typeof username != "string") {
		errors.body.push("username property in user must be a string");
	}

	if (errors.body.length) return badRequest({ errors });
	//next();
}
