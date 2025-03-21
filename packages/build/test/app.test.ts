import { expect, test } from "vitest";
import Server from "../src/server/Server";

test("app router methods", () => {
	let app = new Server();
	expect(app).not.toBeUndefined();
	/*
	app.add("GET", "/blah", () => "hi there");
	expect(app.match("GET", "/blah")).not.toBeUndefined();
	expect(app.match("POST", "/blah")).toBeUndefined();

	app.get("/", () => "hi there");
	app.head("/", () => "hi there");
	app.patch("/", () => "hi there");
	app.post("/", () => "hi there");
	app.put("/", () => "hi there");
	app.delete("/", () => "hi there");
	app.options("/", () => "hi there");
	app.connect("/", () => "hi there");
	app.trace("/", () => "hi there");

	expect(app.match("GET", "/")).not.toBeUndefined();
	expect(app.match("HEAD", "/")).not.toBeUndefined();
	expect(app.match("PATCH", "/")).not.toBeUndefined();
	expect(app.match("POST", "/")).not.toBeUndefined();
	expect(app.match("PUT", "/")).not.toBeUndefined();
	expect(app.match("DELETE", "/")).not.toBeUndefined();
	expect(app.match("OPTIONS", "/")).not.toBeUndefined();
	expect(app.match("CONNECT", "/")).not.toBeUndefined();
	expect(app.match("TRACE", "/")).not.toBeUndefined();
	*/
});

test("app router params", () => {
	let app = new Server();
	expect(app).not.toBeUndefined();
	/*
	app.add("GET", "/posts/[id]", () => "hi there");

	let route = app.match("GET", "/posts/5");

	expect(route).not.toBeUndefined();
	expect(route!.handler).not.toBeUndefined();
	expect(route!.params).not.toBeUndefined();
	expect(route!.params!.id).toBe("5");
	*/
});
