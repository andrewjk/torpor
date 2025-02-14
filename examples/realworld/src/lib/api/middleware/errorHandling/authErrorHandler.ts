import { badRequest, unauthorized } from "@torpor/build/response";
import logger from "../../utils/logger";

/**
 * Middleware that handles authentication errors.
 * @param err Error
 * @param _req Request
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function authErrorHandler(
	err: Error,
	_req: Request,
	res: Response,
	next: NextFunction,
) {
	if (!(err instanceof UnauthorizedError)) return next(err);

	// Se why authorization failed
	logger.debug(`Authorization failed due to ${err.code}`);
	switch (err.code) {
		case "credentials_required":
			return unauthorized();
		case "credentials_bad_scheme":
			return badRequest({
				errors: { header: ["authorization token with bad scheme"] },
			});
		case "invalid_token":
			return unauthorized({ errors: { header: ["authorization token is invalid"] } });
		default:
			logger.error(`Unhandled UnauthorizedError with code ${err.code}`);
			return serverError;
	}
}
