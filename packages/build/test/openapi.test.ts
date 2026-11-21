import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { createServer as createViteServer } from "vite";
import buildOpenApiDocument from "../src/openapi/document";
import openApiDocsHtml from "../src/openapi/docsHtml";
import { OPEN_API_STATE_KEY, openApi } from "../src/openapi/plugin";
import { createOpenApiHandler } from "../src/openapi/serve";
import type { JsonSchema, ResolvedOpenApiOptions } from "../src/openapi/types";
import Site from "../src/site/Site";
import { openApiGlueCode } from "../src/site/manifest";
import runOpenApi from "../src/run/runOpenApi";
import { runTest } from "../src/test";
import type ServerLoadEvent from "../src/types/ServerLoadEvent";
import type { StandardSchemaV1 } from "../src/types/StandardSchema";

/**
 * A standard schema that carries its JSON Schema form alongside it, so that
 * tests can pass a simple converter without depending on a schema library.
 */
function schemaWith(json: JsonSchema): StandardSchemaV1 & { json: JsonSchema } {
	return {
		json,
		"~standard": {
			version: 1,
			vendor: "test",
			validate: (value: unknown) => ({ value }),
			types: { input: undefined as any, output: undefined as any },
		},
	} as any;
}

/** A converter for schemas made with `schemaWith` */
const toJsonSchema = (s: StandardSchemaV1): JsonSchema => (s as any).json;

const paramsAndQuerySchema = schemaWith({
	type: "object",
	properties: {
		id: { type: "string" },
	},
	required: ["id"],
});

const sortQuerySchema = schemaWith({
	type: "object",
	properties: {
		sort: { type: "string", enum: ["asc", "desc"] },
		limit: { type: "integer" },
	},
	required: ["limit"],
});

const postBodySchema = schemaWith({
	type: "object",
	properties: {
		title: { type: "string" },
	},
	required: ["title"],
});

describe("buildOpenApiDocument", () => {
	test("maps params, query, and body schemas onto operations", () => {
		const doc = buildOpenApiDocument(
			[
				{
					path: "/api/posts/[id]",
					endPoint: {
						schema: { params: paramsAndQuerySchema, get: sortQuerySchema },
						get: async () => undefined,
					},
				},
				{
					path: "/api/posts",
					endPoint: {
						schema: { post: postBodySchema },
						post: async () => undefined,
					},
				},
			],
			{ toJsonSchema, title: "Test API", version: "2.0.0" },
		);

		expect(doc.openapi).toBe("3.1.0");
		expect(doc.info).toEqual({ title: "Test API", version: "2.0.0" });

		const pathItem = (doc.paths as any)["/api/posts/{id}"];
		expect(pathItem).toBeDefined();

		const get = pathItem.get;
		expect(get.operationId).toBe("getApiPostsId");

		// The params schema becomes path parameters (always required)
		const idParam = get.parameters.find((p: any) => p.name === "id");
		expect(idParam).toMatchObject({ name: "id", in: "path", required: true });

		// The get schema becomes query parameters, with `required` from the
		// schema's required array
		const sortParam = get.parameters.find((p: any) => p.name === "sort");
		expect(sortParam).toMatchObject({ name: "sort", in: "query", required: false });
		const limitParam = get.parameters.find((p: any) => p.name === "limit");
		expect(limitParam).toMatchObject({ name: "limit", in: "query", required: true });

		// Responses are stubbed: 200 always, 422 when there's an input schema
		expect(get.responses["200"].description).toBe("OK");
		expect(get.responses["422"].description).toBe("Validation failed");

		// The post schema becomes a json request body
		const post = (doc.paths as any)["/api/posts"].post;
		expect(post.operationId).toBe("postApiPosts");
		expect(post.requestBody.required).toBe(true);
		expect(post.requestBody.content["application/json"].schema).toEqual(postBodySchema.json);
	});

	test("maps `del` to the delete operation", () => {
		const doc = buildOpenApiDocument(
			[
				{
					path: "/api/posts/[id]",
					endPoint: {
						schema: { params: paramsAndQuerySchema },
						del: async () => undefined,
					},
				},
			],
			{ toJsonSchema },
		);

		const pathItem = (doc.paths as any)["/api/posts/{id}"];
		expect(pathItem.delete).toBeDefined();
		expect(pathItem.delete.operationId).toBe("deleteApiPostsId");
		// No input schema for the handler, so no 422 stub
		expect(pathItem.delete.responses["422"]).toBeUndefined();
	});

	test("handles catch-all route params", () => {
		const doc = buildOpenApiDocument(
			[{ path: "/files/[...path]", endPoint: { get: async () => undefined } }],
			{ toJsonSchema },
		);
		expect((doc.paths as any)["/files/{path}"]).toBeDefined();
	});

	test("skips endpoints without handlers", () => {
		const doc = buildOpenApiDocument(
			[
				{ path: "/api/nothing", endPoint: { schema: { params: paramsAndQuerySchema } } },
				{ path: "/api/something", endPoint: { get: async () => undefined } },
			],
			{ toJsonSchema },
		);
		expect((doc.paths as any)["/api/nothing"]).toBeUndefined();
		expect((doc.paths as any)["/api/something"]).toBeDefined();
	});

	test("throws when a schema is declared but no converter was supplied", () => {
		expect(() =>
			buildOpenApiDocument(
				[
					{ path: "/api/posts", endPoint: { schema: { post: postBodySchema } } },
					{ path: "/api/plain", endPoint: { get: async () => undefined } },
				],
				{},
			),
		).toThrowError(/\/api\/posts.*toJsonSchema/s);
	});
});

describe("openApi plugin", () => {
	test("registers a docs route and stores resolved options", async () => {
		const site = new Site();
		await openApi({ toJsonSchema, title: "My API" })(site);

		expect(site.routes.some((r) => r.path === "/docs" && r.type === 3)).toBe(true);

		const options = site.pluginState.get(OPEN_API_STATE_KEY);
		expect(options).toMatchObject({
			path: "/openapi.json",
			docs: "/docs",
			title: "My API",
			version: "1.0.0",
		});
	});

	test("docs route serves the Swagger UI page pointing at the document", async () => {
		const site = new Site();
		await openApi({ toJsonSchema })(site);

		const res = await runTest(site, "/docs");
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toContain("text/html");
		const html = await res.text();
		expect(html).toContain("swagger-ui");
		expect(html).toContain("/openapi.json");
	});

	test("docs: false skips the docs route", async () => {
		const site = new Site();
		await openApi({ toJsonSchema, docs: false })(site);
		expect(site.routes.some((r) => r.path === "/docs")).toBe(false);
		expect((site.pluginState.get(OPEN_API_STATE_KEY) as any)?.docs).toBeUndefined();
	});

	test("custom paths get a leading slash", async () => {
		const site = new Site();
		await openApi({ toJsonSchema, path: "api-docs", docs: "reference" })(site);
		expect((site.pluginState.get(OPEN_API_STATE_KEY) as any)?.path).toBe("/api-docs");
		expect((site.pluginState.get(OPEN_API_STATE_KEY) as any)?.docs).toBe("/reference");
	});

	test("throws when a route already exists at the document path", () => {
		const site = new Site();
		site.addRoute("/openapi.json", { server: { get: async () => undefined } });
		expect(() => openApi({ toJsonSchema })(site)).toThrowError(/already a route/);
	});
});

describe("openApiDocsHtml", () => {
	test("includes the document url", () => {
		const html = openApiDocsHtml("/openapi.json");
		expect(html).toContain(`url: "/openapi.json"`);
	});
});

/**
 * A minimal event for the document handler: only its `url` is needed by the
 * tests' hooks.
 */
function eventFor(path: string): ServerLoadEvent {
	return { url: new URL(`http://localhost${path}`) } as ServerLoadEvent;
}

describe("createOpenApiHandler", () => {
	const endPoint = { get: async () => undefined };

	test("builds the base document once and serves it", async () => {
		let loads = 0;
		const handler = createOpenApiHandler(
			{
				"/api/posts": async () => {
					loads++;
					return { default: endPoint };
				},
			},
			() => ({}),
		);

		const first = await handler(eventFor("/openapi.json"));
		const second = await handler(eventFor("/openapi.json"));

		// The endpoint loaders ran once, for the first request
		expect(loads).toBe(1);
		expect(first.headers.get("Content-Type")).toBe("application/json");
		const doc = await second.json();
		expect(doc.openapi).toBe("3.1.0");
		expect(doc.paths["/api/posts"]).toBeDefined();
	});

	test("applies extend per request with the request's event", async () => {
		const handler = createOpenApiHandler(
			{ "/api/posts": async () => ({ default: endPoint }) },
			() => ({
				// One document per workspace: the paths come from the route params
				extend: async (doc, event) => {
					(doc.paths as Record<string, unknown>)[event.url.pathname] = {
						get: { summary: `Document for ${event.url.pathname}` },
					};
					return doc;
				},
			}),
		);

		const one = await (await handler(eventFor("/api/w/one/v1/openapi.json"))).json();
		const two = await (await handler(eventFor("/api/w/two/v1/openapi.json"))).json();

		expect(one.paths["/api/w/one/v1/openapi.json"].get.summary).toBe(
			"Document for /api/w/one/v1/openapi.json",
		);
		expect(two.paths["/api/w/two/v1/openapi.json"]).toBeDefined();
		// Each request got its own copy, so one's extension didn't leak into
		// two's document (or into the cached base)
		expect(two.paths["/api/w/one/v1/openapi.json"]).toBeUndefined();
		expect(one.paths["/api/posts"]).toBeDefined();
		expect(two.paths["/api/posts"]).toBeDefined();
	});

	test("extend can replace the returned document", async () => {
		const handler = createOpenApiHandler(
			{ "/api/posts": async () => ({ default: endPoint }) },
			() => ({
				extend: () => ({ openapi: "3.1.0", info: { title: "Custom", version: "1" }, paths: {} }),
			}),
		);

		const doc = await (await handler(eventFor("/openapi.json"))).json();
		expect(doc.info.title).toBe("Custom");
		expect(doc.paths).toEqual({});
	});
});

describe("openApiGlueCode", () => {
	test("generates a document route that hands the request to the handler", () => {
		const site = new Site();
		site.addRoute("/api/posts", { server: { get: async () => undefined } });
		const options: ResolvedOpenApiOptions = {
			path: "/openapi.json",
			docs: undefined,
			title: "API",
			version: "1.0.0",
			toJsonSchema: undefined,
			extend: (doc) => doc,
		};

		const glue = openApiGlueCode(site, options);

		// The handler gets the request (so `extend` can build a document from
		// it), and reads the plugin's options at runtime
		expect(glue).toContain("createOpenApiHandler(");
		expect(glue).toContain("() => __site.pluginState.get(OPEN_API_STATE_KEY)");
		expect(glue).toContain('"/api/posts"');
	});
});

describe("runOpenApi", () => {
	let tmpRoot = "";

	beforeAll(async () => {
		tmpRoot = await fs.mkdtemp(path.join(tmpdir(), "torpor-build-openapi-test-"));
		await fs.mkdir(path.join(tmpRoot, "src/routes/api/posts"), { recursive: true });
		await fs.writeFile(
			path.join(tmpRoot, "src/routes/api/posts/+server.ts"),
			`
export default {
	schema: {},
	get: async () => new Response("[]"),
};
`,
		);
	});

	afterAll(async () => {
		if (tmpRoot) await fs.rm(tmpRoot, { recursive: true, force: true });
	});

	test("writes a document for the site's server routes", async () => {
		const site = new Site();
		site.root = tmpRoot;
		site.addRoute("/api/posts", { server: "src/routes/api/posts/+server.ts" });
		await openApi({ toJsonSchema })(site);

		const vite = await createViteServer({
			server: { middlewareMode: true },
			appType: "custom",
			resolve: { tsconfigPaths: true },
			optimizeDeps: { noDiscovery: true },
		});
		try {
			const outFile = path.join(tmpRoot, "openapi.json");
			await runOpenApi(site, vite, outFile);

			const doc = JSON.parse(await fs.readFile(outFile, "utf8"));
			expect(Object.keys(doc.paths)).toEqual(["/api/posts"]);
			expect(doc.paths["/api/posts"].get).toBeDefined();
		} finally {
			await vite.close();
		}
	});

	test("throws when the plugin isn't registered", async () => {
		const site = new Site();
		site.root = tmpRoot;
		const vite = await createViteServer({
			server: { middlewareMode: true },
			appType: "custom",
		});
		try {
			await expect(runOpenApi(site, vite)).rejects.toThrowError(/openApi\(\)/);
		} finally {
			await vite.close();
		}
	});
});
