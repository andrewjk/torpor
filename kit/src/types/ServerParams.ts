import { IncomingMessage, ServerResponse } from "node:http";
import CookieHelper from "./CookieHelper";

export default interface ServerParams {
	url: URL;
	params: Record<string, string>;
	// TODO: Would be nicer if these were Request/Response?
	request: Request;
	response: ServerResponse;
	cookies: CookieHelper;
}
