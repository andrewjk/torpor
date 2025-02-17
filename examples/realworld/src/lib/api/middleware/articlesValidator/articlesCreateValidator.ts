import { badRequest } from "@torpor/build/response";
import { ValidationError } from "../../utils/ValidationError";

/**
 * Middleware to validate input for article creation controller.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesCreateValidator(request: Request) {
	const errors: ValidationError = {};
	errors.body = [];

	if (!request.body) {
		errors.body.push("can't be empty");
		return badRequest({ errors });
	}

	if (!request.body.article && typeof req.body.article != "object") {
		errors.body.push("article must be an object inside body");
		return badRequest({ errors });
	}

	const { title, description, body, tagList } = req.body.article;

	// Checks if title description and body are present and non-empty strings.
	const requiredChecks = { title, description, body };
	for (const [variable, content] of Object.entries(requiredChecks)) {
		if (typeof content != "string" || content.length == 0) {
			errors.body.push(`${variable} field must be a non-empty string`);
		}
	}

	// Checks if tagList is an array of strings in case it is not undefined.
	if (tagList && !Array.isArray(tagList))
		errors.body.push("tagList must be an array of non-empty strings");
	else if (tagList) {
		let foundError = false;
		for (const tag of tagList) {
			if (typeof tag != "string" || tag.length == 0) {
				foundError = true;
			}
		}
		if (foundError) errors.body.push("tagList must be an array of non-empty strings");
	}

	if (errors.body.length) return badRequest({ errors });
	//next();
}
