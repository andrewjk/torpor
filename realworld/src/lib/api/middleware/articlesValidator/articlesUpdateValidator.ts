import { badRequest } from "@tera/kit/response";
import { ValidationError } from "../../utils/types";

/**
 * Middleware to validate request properties for articles update controller.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function articlesUpdateValidator(request: Request) {
	const errors: ValidationError = {};
	errors.body = [];
	if (!req.body) {
		errors.body.push("can't be empty");
		return badRequest({ errors });
	}

	if (!req.body.article && typeof req.body.article != "object") {
		errors.body.push("article must be an object inside body");
		return badRequest({ errors });
	}

	const { title, description, body } = req.body.article;

	if (title && typeof title != "string") errors.body.push("title must be a string");

	if (description && typeof description != "string")
		errors.body.push("description must be a string");

	if (body && typeof body != "string") errors.body.push("body must be a string");

	if (errors.body.length) return badRequest({ errors });

	next();
}
