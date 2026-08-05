import { describe, expect, test } from "vite-plus/test";
import {
	badRequest,
	created,
	forbidden,
	found,
	methodNotAllowed,
	movedPermanently,
	notFound,
	notModified,
	ok,
	permanentRedirect,
	response,
	seeOther,
	serverError,
	temporaryRedirect,
	transfer,
	unauthorized,
	unprocessable,
} from "../src/response";

describe("response", () => {
	test("response with no body has no Content-Type", () => {
		const res = response(204);
		expect(res.status).toBe(204);
		expect(res.headers.get("Content-Type")).toBeNull();
		expect(res.body).toBeNull();
	});

	test("response with string body is text/plain", async () => {
		const res = response(200, "hello");
		expect(res.headers.get("Content-Type")).toBe("text/plain");
		expect(await res.text()).toBe("hello");
	});

	test("response with object body is application/json", async () => {
		const res = response(200, { name: "alice" });
		expect(res.headers.get("Content-Type")).toBe("application/json");
		expect(await res.json()).toEqual({ name: "alice" });
	});

	test("response with array body is application/json", async () => {
		const res = response(200, [1, 2, 3]);
		expect(res.headers.get("Content-Type")).toBe("application/json");
		expect(await res.json()).toEqual([1, 2, 3]);
	});
});

describe("2xx helpers", () => {
	test("ok() defaults to 200 with no body", () => {
		const res = ok();
		expect(res.status).toBe(200);
		expect(res.body).toBeNull();
	});

	test("ok(body) passes the body through", async () => {
		const res = ok("hi");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("hi");
	});

	test("created() is 201", () => {
		expect(created().status).toBe(201);
	});

	test("created(body) passes the body through", async () => {
		const res = created({ id: 1 });
		expect(res.status).toBe(201);
		expect(await res.json()).toEqual({ id: 1 });
	});
});

describe("3xx redirect helpers", () => {
	test("transfer sets Location header", () => {
		const res = transfer(302, "/dest");
		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe("/dest");
		expect(res.body).toBeNull();
	});

	test("transfer accepts all redirect status codes", () => {
		const codes = [300, 301, 302, 303, 304, 307, 308] as const;
		for (const code of codes) {
			expect(transfer(code, "/x").status).toBe(code);
		}
	});

	test("movedPermanently is 301 (regression: was returning 308)", () => {
		expect(movedPermanently("/x").status).toBe(301);
	});

	test("found is 302 (regression: was returning 308)", () => {
		expect(found("/x").status).toBe(302);
	});

	test("seeOther is 303", () => {
		expect(seeOther("/x").status).toBe(303);
	});

	test("notModified is 304 with no location", () => {
		const res = notModified();
		expect(res.status).toBe(304);
		expect(res.headers.get("location")).toBe("");
	});

	test("temporaryRedirect is 307", () => {
		expect(temporaryRedirect("/x").status).toBe(307);
	});

	test("permanentRedirect is 308", () => {
		expect(permanentRedirect("/x").status).toBe(308);
	});

	test("all redirects carry the location header", () => {
		const loc = "/somewhere";
		expect(movedPermanently(loc).headers.get("location")).toBe(loc);
		expect(found(loc).headers.get("location")).toBe(loc);
		expect(seeOther(loc).headers.get("location")).toBe(loc);
		expect(temporaryRedirect(loc).headers.get("location")).toBe(loc);
		expect(permanentRedirect(loc).headers.get("location")).toBe(loc);
	});
});

describe("4xx helpers", () => {
	test("badRequest defaults to message 'Bad request'", async () => {
		const res = badRequest();
		expect(res.status).toBe(400);
		expect(await res.text()).toBe("Bad request");
	});

	test("badRequest passes custom body", async () => {
		const res = badRequest({ code: "INVALID" });
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ code: "INVALID" });
	});

	test("unauthorized defaults to message 'Unauthorized'", async () => {
		const res = unauthorized();
		expect(res.status).toBe(401);
		expect(await res.text()).toBe("Unauthorized");
	});

	test("forbidden defaults to message 'Forbidden'", async () => {
		const res = forbidden();
		expect(res.status).toBe(403);
		expect(await res.text()).toBe("Forbidden");
	});

	test("notFound defaults to message 'Not found'", async () => {
		const res = notFound();
		expect(res.status).toBe(404);
		expect(await res.text()).toBe("Not found");
	});

	test("methodNotAllowed defaults to message 'Method not allowed'", async () => {
		const res = methodNotAllowed();
		expect(res.status).toBe(405);
		expect(await res.text()).toBe("Method not allowed");
	});

	test("unprocessable defaults to message 'Unprocessable'", async () => {
		const res = unprocessable();
		expect(res.status).toBe(422);
		expect(await res.text()).toBe("Unprocessable");
	});
});

describe("5xx helpers", () => {
	test("serverError defaults to message 'Server error'", async () => {
		const res = serverError();
		expect(res.status).toBe(500);
		expect(await res.text()).toBe("Server error");
	});

	test("serverError accepts a custom body", async () => {
		const res = serverError("boom");
		expect(res.status).toBe(500);
		expect(await res.text()).toBe("boom");
	});

	test("serverError accepts an Error object as JSON-ish body", async () => {
		const res = serverError({ message: "boom" });
		expect(res.status).toBe(500);
		expect(await res.json()).toEqual({ message: "boom" });
	});
});
