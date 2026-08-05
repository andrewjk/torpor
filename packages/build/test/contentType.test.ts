import { describe, expect, test } from "vite-plus/test";
import contentType from "../src/server/contentType";

describe("contentType", () => {
	test("returns application/octet-stream for unknown extensions", () => {
		expect(contentType(".unknown")).toBe("application/octet-stream");
		expect(contentType("totally-made-up")).toBe("application/octet-stream");
	});

	test("returns application/octet-stream for empty input", () => {
		expect(contentType("")).toBe("application/octet-stream");
	});

	test("returns the correct type for common web assets", () => {
		expect(contentType(".html")).toBe("text/html");
		expect(contentType(".css")).toBe("text/css");
		expect(contentType(".js")).toBe("text/javascript");
		expect(contentType(".mjs")).toBe("text/javascript");
		expect(contentType(".json")).toBe("application/json");
		expect(contentType(".svg")).toBe("image/svg+xml");
	});

	test("returns the correct type for image formats", () => {
		expect(contentType(".png")).toBe("image/png");
		expect(contentType(".jpg")).toBe("image/jpeg");
		expect(contentType(".jpeg")).toBe("image/jpeg");
		expect(contentType(".gif")).toBe("image/gif");
		expect(contentType(".webp")).toBe("image/webp");
		expect(contentType(".avif")).toBe("image/avif");
	});

	test("returns the correct type for font formats", () => {
		expect(contentType(".woff")).toBe("font/woff");
		expect(contentType(".woff2")).toBe("font/woff2");
		expect(contentType(".ttf")).toBe("font/ttf");
		expect(contentType(".otf")).toBe("font/otf");
	});

	test("returns the correct type for video formats", () => {
		expect(contentType(".mp4")).toBe("video/mp4");
		expect(contentType(".webm")).toBe("video/webm");
	});

	test("returns the correct type for audio formats", () => {
		expect(contentType(".mp3")).toBe("audio/mpeg");
		expect(contentType(".opus")).toBe("audio/ogg");
	});

	test("returns text/plain for .txt", () => {
		expect(contentType(".txt")).toBe("text/plain");
	});

	test("returns application/xml for .xml", () => {
		expect(contentType(".xml")).toBe("application/xml");
	});

	test("returns application/pdf for .pdf", () => {
		expect(contentType(".pdf")).toBe("application/pdf");
	});

	test("returns application/zip for .zip", () => {
		expect(contentType(".zip")).toBe("application/zip");
	});

	test("returns application/gzip for .gz", () => {
		expect(contentType(".gz")).toBe("application/gzip");
	});

	test("note: .ts returns video/mp2t (the MIME type), not text/typescript", () => {
		// Documents a gotcha: `.ts` is a registered MIME for MPEG-2 transport
		// stream video, not TypeScript. Useful to assert so it isn't silently
		// changed without consideration.
		expect(contentType(".ts")).toBe("video/mp2t");
	});
});
