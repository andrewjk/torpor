import { expect, test } from "vite-plus/test";
import { runTest } from "../src/test";
import ServerEvent from "../src/server/ServerEvent";
import Site from "../src/site/Site";
import type ServerEndPoint from "../src/types/ServerEndPoint";
import type { StandardSchemaV1 } from "../src/types/StandardSchema";

/**
 * A minimal standard schema, as a schema library (zod, valibot, ...) would
 * implement it. It requires a `title` string and returns the title uppercased.
 */
const postSchema: StandardSchemaV1<{ title: string }, { title: string; upper: string }> = {
	"~standard": {
		version: 1,
		vendor: "test",
		validate: (value) => {
			const title = (value as { title?: unknown } | undefined)?.title;
			if (typeof title !== "string") {
				return { issues: [{ message: "title is required", path: ["title"] }] };
			}
			return { value: { title, upper: title.toUpperCase() } };
		},
		types: { input: undefined as any, output: undefined as any },
	},
};

function siteWithSchemaEndpoint(): { site: Site; calls: number[] } {
	const calls: number[] = [];
	const site = new Site();
	site.addRoute("/api/posts", {
		server: {
			schema: {
				post: postSchema,
			},
			post: async (ev) => {
				calls.push(1);
				// The body read in the handler is the schema's parsed output
				const body = await ev.json();
				return new Response(JSON.stringify(body), {
					headers: { "Content-Type": "application/json" },
				});
			},
			put: async (ev) => {
				calls.push(1);
				const body = await ev.json();
				return new Response(JSON.stringify(body), {
					headers: { "Content-Type": "application/json" },
				});
			},
		} satisfies ServerEndPoint<"/api/posts">,
	});
	return { site, calls };
}

function postEvent(path: string, body: string): ServerEvent {
	const req = new Request(`http://localhost${path}`, {
		method: "POST",
		body,
		headers: { "Content-Type": "application/json" },
	});
	return new ServerEvent(req);
}

test("a valid request body is parsed and passed to the handler", async () => {
	const { site, calls } = siteWithSchemaEndpoint();
	const ev = postEvent("/api/posts", JSON.stringify({ title: "hello" }));
	const res = await runTest(site, "/api/posts", ev);

	expect(res.status).toBe(200);
	expect(await res.json()).toEqual({ title: "hello", upper: "HELLO" });
	expect(calls).toHaveLength(1);
});

test("an invalid request body is rejected with 422 before the handler runs", async () => {
	const { site, calls } = siteWithSchemaEndpoint();
	const ev = postEvent("/api/posts", JSON.stringify({ nope: 1 }));
	const res = await runTest(site, "/api/posts", ev);

	expect(res.status).toBe(422);
	const body = await res.json();
	expect(body.message).toBe("Validation failed");
	expect(body.issues).toEqual([{ message: "title is required", path: ["title"] }]);
	expect(calls).toHaveLength(0);
});

test("handlers without a schema still read the raw request body", async () => {
	const { site } = siteWithSchemaEndpoint();
	const req = new Request("http://localhost/api/posts", {
		method: "PUT",
		body: JSON.stringify({ anything: true }),
		headers: { "Content-Type": "application/json" },
	});
	const res = await runTest(site, "/api/posts", new ServerEvent(req));

	expect(res.status).toBe(200);
	expect(await res.json()).toEqual({ anything: true });
});
