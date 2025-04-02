import {
	type IncomingMessage,
	type OutgoingHttpHeader,
	type OutgoingHttpHeaders,
	ServerResponse,
} from "node:http";
import { PassThrough, Readable } from "node:stream";

// From https://github.com/vikejs/vike-node/blob/main/packages/vike-node/src/runtime/adapters/createServerResponse.ts

/**
 * Creates a custom ServerResponse object that allows for intercepting and
 * streaming the response.
 *
 * @param incomingMessage The incoming HTTP request message.
 * @returns An object containing the custom ServerResponse and a function that
 * takes a callback to invoke when the response is readable, providing an object
 * with the readable stream, headers and status code.
 */
export default function nodeMessageToNodeResponse(
	incomingMessage: IncomingMessage,
): ServerResponseResponse {
	const res = new ServerResponse(incomingMessage);
	const passThrough = new PassThrough();
	let handled = false;

	const onReadable = (
		cb: (result: { readable: Readable; headers: OutgoingHttpHeaders; status: number }) => void,
	) => {
		const handleReadable = () => {
			if (handled) return;
			handled = true;
			cb({
				readable: Readable.from(passThrough),
				headers: res.getHeaders(),
				status: res.statusCode,
			});
		};

		passThrough.once("readable", handleReadable);
		passThrough.once("end", handleReadable);
	};

	passThrough.once("finish", () => {
		res.emit("finish");
	});
	passThrough.once("close", () => {
		res.destroy();
		res.emit("close");
	});
	passThrough.on("drain", () => {
		res.emit("drain");
	});

	res.write = passThrough.write.bind(passThrough);
	res.end = passThrough.end.bind(passThrough) as any;

	res.writeHead = function writeHead(
		statusCode: number,
		statusMessage?: string | OutgoingHttpHeaders | OutgoingHttpHeader[],
		headers?: OutgoingHttpHeaders | OutgoingHttpHeader[],
	): ServerResponse {
		res.statusCode = statusCode;
		if (typeof statusMessage === "object") {
			headers = statusMessage;
			statusMessage = undefined;
		}
		if (headers) {
			for (const [key, value] of Object.entries(headers)) {
				if (value !== undefined) {
					res.setHeader(key, value);
				}
			}
		}
		return res;
	};

	return {
		res,
		onReadable,
	};
}

type ServerResponseResponse = {
	res: ServerResponse;
	onReadable: (
		cb: (result: { readable: Readable; headers: OutgoingHttpHeaders; status: number }) => void,
	) => void;
};
