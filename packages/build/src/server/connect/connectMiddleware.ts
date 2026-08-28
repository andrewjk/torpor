import { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type MiddlewareFunction from "../types/MiddlewareFunction";
import flattenHeaders from "./flattenHeaders";
import nodeMessageToNodeResponse from "./nodeMessageToNodeResponse";
import requestToNodeMessage from "./requestToNodeMessage";

// From https://github.com/vikejs/vike-node/blob/main/packages/vike-node/src/runtime/adapters/connectToWeb.ts

/**
 * Converts a Connect-style middleware to a torpor middleware.
 *
 * If the Connect handler writes a response, it is returned from the `enter`
 * hook and the middleware chain is short-circuited. If the handler calls
 * `next()`, the rest of the chain runs after this middleware completes.
 *
 * @param handler - The Connect-style middleware function to be converted.
 * @returns A middleware whose `enter` hook handles the web request.
 */
export default function connectMiddleware(
	handler: ConnectMiddleware | ConnectMiddlewareBoolean,
): MiddlewareFunction {
	return {
		enter: (ev) =>
			new Promise<Response | void>((resolve, reject) => {
				const req = requestToNodeMessage(ev.request);
				const { res, onReadable } = nodeMessageToNodeResponse(req);

				onReadable(({ readable, headers, status }) => {
					const responseBody: ReadableStream | null = statusCodesWithoutBody.includes(status)
						? null
						: (Readable.toWeb(readable) as unknown as ReadableStream);
					resolve(
						new Response(responseBody, {
							status,
							headers: flattenHeaders(headers),
						}),
					);
				});

				const cnext = (error?: unknown) => {
					if (error) {
						// eslint-disable-next-line no-base-to-string
						reject(error instanceof Error ? error : new Error(String(error)));
					} else {
						// The Connect handler is passing the request on
						resolve();
					}
				};

				Promise.resolve(handler(req, res, cnext))
					.then((handled) => {
						if (handled === false) {
							res.destroy();
							// Returning false signals that the request was handled,
							// so return an empty response to stop the chain
							resolve(new Response(null, { status: 200 }));
						}
					})
					.catch((e: unknown) => {
						cnext(e);
					});
			}),
	};
}

const statusCodesWithoutBody = [
	100, // Continue
	101, // Switching Protocols
	102, // Processing (WebDAV)
	103, // Early Hints
	204, // No Content
	205, // Reset Content
	304, // Not Modified
];

type NextFunction = (err?: unknown) => void;
type ConnectMiddleware<
	PlatformRequest extends IncomingMessage = IncomingMessage,
	PlatformResponse extends ServerResponse = ServerResponse,
> = (req: PlatformRequest, res: PlatformResponse, next: NextFunction) => void | Promise<void>;
type ConnectMiddlewareBoolean<
	PlatformRequest extends IncomingMessage = IncomingMessage,
	PlatformResponse extends ServerResponse = ServerResponse,
> = (req: PlatformRequest, res: PlatformResponse, next: NextFunction) => boolean | Promise<boolean>;
