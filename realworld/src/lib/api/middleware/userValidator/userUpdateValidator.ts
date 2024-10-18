import { badRequest } from "@tera/kit/response";
import { ValidationError } from "../../utils/types";

/**
 * This function is a middleware that validates the user information in the request in order to log the user.
 * If the request is malformed it responds accordingly and returns, stopping the flow of the express.
 * If the request is well formed, it passes control to the next handler.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function userUpdateValidator(request: Request) {
	const errors: ValidationError = {};
	errors.body = [];

	if (!req.body) {
		errors.body.push("can't be empty");
		return badRequest({ errors });
	}

	const { user } = req.body;
	if (!user) {
		errors.body.push("user property must exist");
		return badRequest({ errors });
	}

	if (typeof user != "object") {
		errors.body.push("user must be an object");
		return badRequest({ errors });
	}

	const optional_fields = ["email", "username", "password", "image", "bio"];
	for (const key of Object.keys(user)) {
		if (typeof key != "string" && key in optional_fields) {
			errors.body.push(`${key} must be of type string`);
		}
		if (!optional_fields.includes(key)) {
			errors.body.push(`${key} is not one of the fields accepted`);
		}
	}

	if (errors.body.length) return badRequest({ errors });
	//next();
}
