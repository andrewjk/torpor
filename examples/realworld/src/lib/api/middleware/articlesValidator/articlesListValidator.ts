import { ok } from "@torpor/build/response";
import { ValidationError } from "../../utils/ValidationError";

/**
 * Middleware to validate request properties for articles listing controller.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default async function articlesListValidator(request: Request) {
	const { tag, author, favorited, limit, offset } = request.query;
	const errors: ValidationError = {};
	errors.query = [];

	if (author && typeof author != "string") errors.query.push("author must be a string");

	if (tag && typeof tag != "string") errors.query.push("tag must be a string");

	if (favorited && typeof favorited != "string") errors.query.push("favorited must be a string");

	if (limit && typeof limit != "string") errors.query.push("limit must be a string");
	if (limit && typeof limit == "string") {
		const limitValue = parseInt(limit);
		if (isNaN(limitValue)) errors.query.push("limit is not a valid number");
	}

	if (offset && typeof offset != "string") errors.query.push("offset must be a string");
	if (offset && typeof offset == "string") {
		const offsetValue = parseInt(offset);
		if (isNaN(offsetValue)) errors.query.push("offset is not a valid number");
	}

	if (errors.query.length > 0) return ok({ errors });
	//return next();
}
