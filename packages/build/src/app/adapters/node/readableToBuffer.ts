import { Readable } from "node:stream";

export default function readableToBuffer(req: Readable): Promise<Buffer> {
	return new Promise<Buffer>((resolve, reject) => {
		const chunks: Buffer[] = [];
		req.on("data", (chunk: Buffer) => {
			chunks.push(chunk);
		});
		req.on("end", () => {
			resolve(Buffer.concat(chunks));
		});
		req.on("error", (err) => {
			reject(err);
		});
	});
}
