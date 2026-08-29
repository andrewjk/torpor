import { expect, test } from "vite-plus/test";
import { runTest } from "../src/test";
import ServerEvent from "../src/server/ServerEvent";
import Site from "../src/site/Site";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";
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

/**
 * A query schema requiring a numeric `page` param, e.g. `?page=2`.
 */
const querySchema: StandardSchemaV1<{ page: string }, { page: number }> = {
	"~standard": {
		version: 1,
		vendor: "test",
		validate: (value) => {
			const page = (value as { page?: unknown } | undefined)?.page;
			const n = Number(page);
			if (page === undefined || Number.isNaN(n)) {
				return { issues: [{ message: "page is required", path: ["page"] }] };
			}
			return { value: { page: n } };
		},
		types: { input: undefined as any, output: undefined as any },
	},
};

/**
 * A params schema coercing an `id` param to a number, e.g. `/posts/[id]`.
 */
const paramsSchema: StandardSchemaV1<{ id: string }, { id: number }> = {
	"~standard": {
		version: 1,
		vendor: "test",
		validate: (value) => {
			const id = (value as { id?: unknown } | undefined)?.id;
			const n = Number(id);
			if (id === undefined || Number.isNaN(n)) {
				return { issues: [{ message: "id is required", path: ["id"] }] };
			}
			return { value: { id: n } };
		},
		types: { input: undefined as any, output: undefined as any },
	},
};

/**
 * A minimal standard schema for a form: requires a `title` string and returns
 * it uppercased as well.
 */
const formSchema: StandardSchemaV1<{ title: string }, { title: string; upper: string }> = {
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

function siteWithSchemaAction(): { site: Site; calls: number[] } {
	const calls: number[] = [];
	const site = new Site();
	site.addRoute("/form", {
		pageServer: {
			schema: {
				default: formSchema,
			},
			actions: {
				default: async (ev) => {
					calls.push(1);
					// The form read in the action is the schema's parsed output
					const form = await ev.form();
					return new Response(JSON.stringify(form), {
						headers: { "Content-Type": "application/json" },
					});
				},
			},
		} satisfies PageServerEndPoint,
	});
	return { site, calls };
}

function formEvent(path: string, title?: string): ServerEvent {
	const formData = new FormData();
	if (title !== undefined) formData.append("title", title);
	const req = new Request(`http://localhost${path}`, { method: "POST", body: formData });
	return new ServerEvent(req);
}

test("a valid form submission is parsed and passed to the action", async () => {
	const { site, calls } = siteWithSchemaAction();
	const res = await runTest(site, "/form/~server", formEvent("/form/~server", "hello"));

	expect(res.status).toBe(200);
	expect(await res.json()).toEqual({ title: "hello", upper: "HELLO" });
	expect(calls).toHaveLength(1);
});

test("an invalid form submission is rejected with 422 before the action runs", async () => {
	const { site, calls } = siteWithSchemaAction();
	const res = await runTest(site, "/form/~server", formEvent("/form/~server"));

	expect(res.status).toBe(422);
	const body = await res.json();
	expect(body.message).toBe("Validation failed");
	expect(body.issues).toEqual([{ message: "title is required", path: ["title"] }]);
	expect(calls).toHaveLength(0);
});

test("actions without a schema read the raw form record", async () => {
	const site = new Site();
	site.addRoute("/plain", {
		pageServer: {
			actions: {
				default: async (ev) => {
					const form = await ev.form();
					return new Response(JSON.stringify(form), {
						headers: { "Content-Type": "application/json" },
					});
				},
			},
		} satisfies PageServerEndPoint,
	});

	const formData = new FormData();
	formData.append("a", "1");
	formData.append("b", "2");
	formData.append("b", "3");
	const req = new Request("http://localhost/plain/~server", {
		method: "POST",
		body: formData,
	});
	const res = await runTest(site, "/plain/~server", new ServerEvent(req));

	expect(res.status).toBe(200);
	// Multiple values for one field come back as an array
	expect(await res.json()).toEqual({ a: "1", b: ["2", "3"] });
});

function siteWithQueryEndpoint(): { site: Site; calls: number[] } {
	const calls: number[] = [];
	const site = new Site();
	site.addRoute("/api/posts", {
		server: {
			schema: {
				get: querySchema,
			},
			get: async (ev) => {
				calls.push(1);
				const query = await ev.query();
				return new Response(JSON.stringify(query), {
					headers: { "Content-Type": "application/json" },
				});
			},
		} satisfies ServerEndPoint<"/api/posts">,
	});
	return { site, calls };
}

function getEvent(path: string): ServerEvent {
	return new ServerEvent(new Request(`http://localhost${path}`));
}

test("a valid query string is parsed and passed to a get handler", async () => {
	const { site, calls } = siteWithQueryEndpoint();
	const res = await runTest(site, "/api/posts", getEvent("/api/posts?page=2&sort=asc"));

	expect(res.status).toBe(200);
	// The schema coerces page to a number; unknown params are dropped
	expect(await res.json()).toEqual({ page: 2 });
	expect(calls).toHaveLength(1);
});

test("an invalid query string is rejected with 422 before the handler runs", async () => {
	const { site, calls } = siteWithQueryEndpoint();
	const res = await runTest(site, "/api/posts", getEvent("/api/posts"));

	expect(res.status).toBe(422);
	const body = await res.json();
	expect(body.issues).toEqual([{ message: "page is required", path: ["page"] }]);
	expect(calls).toHaveLength(0);
});

function siteWithParamsEndpoint(): { site: Site; calls: number[] } {
	const calls: number[] = [];
	const site = new Site();
	site.addRoute("/api/posts/[id]", {
		server: {
			schema: {
				params: paramsSchema,
			},
			get: async (ev) => {
				calls.push(1);
				return new Response(JSON.stringify(ev.params), {
					headers: { "Content-Type": "application/json" },
				});
			},
		} satisfies ServerEndPoint<"/api/posts/[id]">,
	});
	return { site, calls };
}

test("valid route params are coerced and passed to the handler", async () => {
	const { site, calls } = siteWithParamsEndpoint();
	const res = await runTest(site, "/api/posts/5", getEvent("/api/posts/5"));

	expect(res.status).toBe(200);
	// The schema coerces the id param to a number
	expect(await res.json()).toEqual({ id: 5 });
	expect(calls).toHaveLength(1);
});

test("invalid route params are rejected with 404, since the url can't exist", async () => {
	const { site, calls } = siteWithParamsEndpoint();
	const res = await runTest(site, "/api/posts/abc", getEvent("/api/posts/abc"));

	expect(res.status).toBe(404);
	expect(calls).toHaveLength(0);
});

function siteWithLoadQuery(): { site: Site; calls: number[] } {
	const calls: number[] = [];
	const site = new Site();
	site.addRoute("/posts", {
		pageServer: {
			schema: {
				load: querySchema,
			},
			load: async (ev) => {
				calls.push(1);
				const query = await ev.query();
				return new Response(JSON.stringify(query), {
					headers: { "Content-Type": "application/json" },
				});
			},
		} satisfies PageServerEndPoint,
	});
	return { site, calls };
}

test("a load function's schema validates the query string", async () => {
	const { site, calls } = siteWithLoadQuery();
	const res = await runTest(site, "/posts/~server", getEvent("/posts/~server?page=3"));

	expect(res.status).toBe(200);
	expect(await res.json()).toEqual({ page: 3 });
	expect(calls).toHaveLength(1);
});

test("a load function with an invalid query is rejected with 422", async () => {
	const { site, calls } = siteWithLoadQuery();
	const res = await runTest(site, "/posts/~server", getEvent("/posts/~server"));

	expect(res.status).toBe(422);
	expect(calls).toHaveLength(0);
});

test("an action's params schema rejects invalid urls with 404", async () => {
	const site = new Site();
	site.addRoute("/posts/[id]", {
		pageServer: {
			schema: {
				params: paramsSchema,
			},
			actions: {
				default: async () => new Response("ok"),
			},
		} satisfies PageServerEndPoint,
	});

	const req = new Request("http://localhost/posts/[id]/~server".replace("[id]", "abc"), {
		method: "POST",
		body: new FormData(),
	});
	const res = await runTest(site, "/posts/abc/~server", new ServerEvent(req));

	expect(res.status).toBe(404);
});

test("an action named with a reserved schema key throws", async () => {
	const site = new Site();
	site.addRoute("/reserved", {
		pageServer: {
			actions: {
				// "load" collides with the reserved query-validation schema
				// key, so it can never get the right schema for its form data
				load: async () => new Response("never"),
			},
		} satisfies PageServerEndPoint,
	});

	const formData = new FormData();
	const req = new Request("http://localhost/reserved/~server?/load", {
		method: "POST",
		body: formData,
	});

	await expect(runTest(site, "/reserved/~server", new ServerEvent(req))).rejects.toThrowError(
		/The action name "load" is reserved/,
	);
});
