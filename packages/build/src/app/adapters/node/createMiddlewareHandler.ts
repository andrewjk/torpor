import { IncomingMessage, ServerResponse } from "node:http";
import MiddlewareFunction from "../../MiddlewareFunction.js";
import flattenHeaders from "./flattenHeaders.js";
import nodeMessageToNodeResponse from "./nodeMessageToNodeResponse.js";
import readableToBuffer from "./readableToBuffer.js";
import requestToNodeMessage from "./requestToNodeMessage.js";

// From https://github.com/vikejs/vike-node/blob/main/packages/vike-node/src/runtime/adapters/connectToWeb.ts

const statusCodesWithoutBody = [
	100, // Continue
	101, // Switching Protocols
	102, // Processing (WebDAV)
	103, // Early Hints
	204, // No Content
	205, // Reset Content
	304, // Not Modified
];

/**
 * Converts a Connect-style middleware to a web-compatible request handler.
 *
 * @param handler - The Connect-style middleware function to be converted.
 * @returns A function that handles web requests and returns a Response or undefined.
 */
export default function createMiddlewareHandler(
	handler: ConnectMiddleware | ConnectMiddlewareBoolean,
): MiddlewareFunction {
	return async (ev, next) => {
		const req = requestToNodeMessage(ev.request);
		const { res, onReadable } = nodeMessageToNodeResponse(req);

		return new Promise<void>(async (resolve, reject) => {
			onReadable(async ({ readable, headers, status }) => {
				const responseBody = statusCodesWithoutBody.includes(status)
					? null
					: // HACK: chunked readers don't get read correctly somewhere
						//(Readable.toWeb(readable) as ReadableStream);
						await readableToBuffer(readable);
				ev.response = new Response(responseBody, {
					status,
					headers: flattenHeaders(headers),
				});
				resolve();
			});

			const cnext = async (error?: unknown) => {
				if (error) {
					reject(error instanceof Error ? error : new Error(String(error)));
				} else {
					// TODO: Can we nest the next functions less? This is weird
					await next();
					resolve();
				}
			};

			try {
				const handled = await handler(req, res, cnext);
				if (handled === false) {
					res.destroy();
					resolve();
				}
			} catch (e) {
				cnext(e);
			}
		});
	};
}

type NextFunction = (err?: unknown) => void;
type ConnectMiddleware<
	PlatformRequest extends IncomingMessage = IncomingMessage,
	PlatformResponse extends ServerResponse = ServerResponse,
> = (req: PlatformRequest, res: PlatformResponse, next: NextFunction) => void | Promise<void>;
type ConnectMiddlewareBoolean<
	PlatformRequest extends IncomingMessage = IncomingMessage,
	PlatformResponse extends ServerResponse = ServerResponse,
> = (req: PlatformRequest, res: PlatformResponse, next: NextFunction) => boolean | Promise<boolean>;
