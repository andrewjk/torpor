import { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type MiddlewareFunction from "../types/MiddlewareFunction";
import flattenHeaders from "./flattenHeaders";
import nodeMessageToNodeResponse from "./nodeMessageToNodeResponse";
import requestToNodeMessage from "./requestToNodeMessage";

// From https://github.com/vikejs/vike-node/blob/main/packages/vike-node/src/runtime/adapters/connectToWeb.ts

/**
 * Converts a Connect-style middleware to a web-compatible request handler.
 *
 * @param handler - The Connect-style middleware function to be converted.
 * @returns A function that handles web requests and returns a Response or undefined.
 */
export default function connectMiddleware(
	handler: ConnectMiddleware | ConnectMiddlewareBoolean,
): MiddlewareFunction {
	return async (ev, next) => {
		const req = requestToNodeMessage(ev.request);
		const { res, onReadable } = nodeMessageToNodeResponse(req);

		await new Promise<void>((resolve, reject) => {
			onReadable(({ readable, headers, status }) => {
				const responseBody: ReadableStream | null = statusCodesWithoutBody.includes(status)
					? null
					: (Readable.toWeb(readable) as unknown as ReadableStream);
				ev.response = new Response(responseBody, {
					status,
					headers: flattenHeaders(headers),
				});
				resolve();
			});

			const cnext = (error?: unknown) => {
				if (error) {
					// eslint-disable-next-line no-base-to-string
					reject(error instanceof Error ? error : new Error(String(error)));
				} else {
					// TODO: Can we nest the next functions less? This is a bit weird
					Promise.resolve(next()).then(resolve, reject);
				}
			};

			Promise.resolve(handler(req, res, cnext))
				.then((handled) => {
					if (handled === false) {
						res.destroy();
						resolve();
					}
				})
				.catch((e: unknown) => {
					cnext(e);
				});
		});
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
