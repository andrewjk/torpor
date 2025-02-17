import { badRequest } from "@torpor/build/response";

/**
 * Middleware that validates the properties of the request for the comment creation controller.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export default function commentCreateValidator(request: Request) {
	const comment = request.body.comment;
	if (!comment) return badRequest({ errors: { body: ["the body must contain a comment object"] } });
	if (typeof comment != "object")
		return badRequest({ errors: { body: ["the comment  must be an object"] } });
	const body = comment.body;
	if (!body || typeof body != "string")
		return badRequest({
			errors: {
				body: ["there must be a body string property in the comment object"],
			},
		});
	//next();
}
