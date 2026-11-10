import { expect, test } from "vite-plus/test";
import {
	compileRestricted,
	createHttpSource,
	httpRequirementKind,
	renderRestricted,
} from "../src/restricted";
import type { HttpOriginPolicy } from "../src/restricted";
import type { ManifestRequirement } from "../src/app";
import EmbedCompileError from "../src/types/EmbedCompileError";

const SOURCE = `
export default function Inbox($props: { queue: string }) {
	@render {
		<div>
			@for (t of $data.tickets) {
				<p>{t.title}</p>
			}
		</div>
	}
}
`;

const DATA: Record<string, ManifestRequirement> = {
	tickets: {
		kind: "http",
		url: "https://api.example.test/tickets",
		auth: "corp-key",
		params: { queue: "$props.queue" },
		pick: "items",
		limit: 2,
	},
};

function artifact(
	source = SOURCE,
	data: Record<string, ManifestRequirement> = DATA,
): ReturnType<typeof compileRestricted> {
	return compileRestricted("inbox", source, {
		requirementKinds: { http: httpRequirementKind },
		data,
	});
}

const TEMPLATE = `
export default function A() {
	@render {
		<p>x</p>
	}
}
`;

interface Captured {
	url: URL;
	init: RequestInit | undefined;
}

function jsonResponse(payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { "content-type": "application/json" },
	});
}

function mockFetch(handler: (url: URL) => Response, captured: Captured[] = []): typeof fetch {
	return (async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = new URL(input instanceof Request ? input.url : String(input));
		captured.push({ url, init });
		return handler(url);
	}) as typeof fetch;
}

function compileErrorOf(
	source = SOURCE,
	data: Record<string, ManifestRequirement> = DATA,
): EmbedCompileError {
	try {
		artifact(source, data);
	} catch (error) {
		expect(error).toBeInstanceOf(EmbedCompileError);
		return error as EmbedCompileError;
	}
	throw new Error("Expected a compile error");
}

test("compile-time shape validation accepts the documented spec", () => {
	const embed = artifact();
	expect(embed.server?.template?.requirements).toEqual([
		{
			name: "tickets",
			kind: "http",
			spec: {
				url: { op: "lit", value: "https://api.example.test/tickets" },
				auth: { op: "lit", value: "corp-key" },
				params: {
					op: "object",
					entries: {
						queue: { op: "get", object: { op: "ref", name: "$props" }, key: "queue" },
					},
				},
				pick: { op: "lit", value: "items" },
				limit: { op: "lit", value: 2 },
			},
		},
	]);
});

test("compile-time validation rejects bad shapes", () => {
	const cases: [Record<string, unknown>, RegExp][] = [
		[{ params: {} }, /http requirements need a "url"/],
		[{ url: "$props.url" }, /http "url" must be a string literal/],
		[{ url: "https://x.test", auth: "$props.key" }, /http "auth" must be a credential name/],
		[{ url: "https://x.test", bogus: 1 }, /Unknown http spec key "bogus"/],
		[{ url: "https://x.test", pick: "a..b" }, /empty segment/],
		[{ url: "https://x.test", limit: 0 }, /positive integer/],
		[{ url: "ftp://x.test" }, /must use http: or https:/],
		[{ url: "https://user:pass@x.test" }, /must not embed credentials/],
	];
	for (const [spec, pattern] of cases) {
		const error = compileErrorOf(TEMPLATE, {
			t: { kind: "http", ...spec } as ManifestRequirement,
		});
		expect(error.errors[0].message).toMatch(pattern);
	}
});

test("fetches, authenticates by credential name, interpolates props, picks and limits", async () => {
	const captured: Captured[] = [];
	const rows = [{ title: "One" }, { title: "Two" }, { title: "Three" }];

	const { body } = await renderRestricted(artifact(), {
		props: { queue: "open" },
		sources: {
			http: createHttpSource({
				allowOrigins: ["https://api.example.test"],
				credentials: { "corp-key": { value: "sekret", prefix: "Bearer " } },
				fetch: mockFetch(() => jsonResponse({ items: rows }), captured),
			}),
		},
	});

	expect(captured.length).toBe(1);
	expect(captured[0].url.origin).toBe("https://api.example.test");
	expect(captured[0].url.pathname).toBe("/tickets");
	expect(captured[0].url.searchParams.get("queue")).toBe("open");
	expect(captured[0].init?.method).toBe("GET");
	expect(captured[0].init?.redirect).toBe("error");
	const headers = captured[0].init?.headers as Record<string, string>;
	expect(headers.authorization).toBe("Bearer sekret");
	expect(headers.accept).toBe("application/json");

	// limit: 2 is applied
	expect(body).toContain("One");
	expect(body).toContain("Two");
	expect(body).not.toContain("Three");
});

test("secrets never enter the artifact", () => {
	const embed = artifact();
	expect(JSON.stringify(embed)).not.toContain("sekret");
	expect(JSON.stringify(embed)).toContain('"corp-key"');
});

test("default deny: no allowed origins rejects every request", async () => {
	await expect(
		renderRestricted(artifact(), {
			props: { queue: "open" },
			sources: { http: createHttpSource({ fetch: mockFetch(() => jsonResponse({ items: [] })) }) },
		}),
	).rejects.toThrow(/origin "https:\/\/api\.example\.test" is not allowed/);
});

test("unconfigured credentials are named without leaking values", async () => {
	await expect(
		renderRestricted(artifact(), {
			props: { queue: "open" },
			sources: {
				http: createHttpSource({
					allowOrigins: ["https://api.example.test"],
					credentials: { other: { value: "don't-leak-me" } },
					fetch: mockFetch(() => jsonResponse({ items: [] })),
				}),
			},
		}),
	).rejects.toThrow(/references credential "corp-key".*Configured credentials: other/s);
});

test("rejects non-JSON responses", async () => {
	await expect(
		renderRestricted(artifact(), {
			props: { queue: "open" },
			sources: {
				http: createHttpSource({
					allowOrigins: ["https://api.example.test"],
					credentials: { "corp-key": { value: "x" } },
					fetch: mockFetch(
						() => new Response("<html></html>", { headers: { "content-type": "text/html" } }),
					),
				}),
			},
		}),
	).rejects.toThrow(/expected JSON/);
});

test("HTTP errors include the path but not the query string", async () => {
	await expect(
		renderRestricted(artifact(), {
			props: { queue: "sensitive-tenant" },
			sources: {
				http: createHttpSource({
					allowOrigins: ["https://api.example.test"],
					credentials: { "corp-key": { value: "x" } },
					fetch: mockFetch(() => jsonResponse({ error: "nope" }, 500)),
				}),
			},
		}),
	).rejects.toThrow(/HTTP 500 from https:\/\/api\.example\.test\/tickets\./);
});

test("oversized responses are rejected", async () => {
	const big = { items: [{ title: "x".repeat(5000) }] };
	await expect(
		renderRestricted(artifact(), {
			props: { queue: "open" },
			sources: {
				http: createHttpSource({
					allowOrigins: ["https://api.example.test"],
					credentials: { "corp-key": { value: "x" } },
					maxResponseBytes: 500,
					fetch: mockFetch(() => jsonResponse(big)),
				}),
			},
		}),
	).rejects.toThrow(/exceeded 500 bytes/);
});

test("invalid JSON and missing pick paths are rejected", async () => {
	const make = (payload: unknown) =>
		createHttpSource({
			allowOrigins: ["https://api.example.test"],
			credentials: { "corp-key": { value: "x" } },
			fetch: mockFetch(() => jsonResponse(payload)),
		});

	await expect(
		renderRestricted(artifact(), {
			props: { queue: "open" },
			sources: {
				http: createHttpSource({
					allowOrigins: ["https://api.example.test"],
					credentials: { "corp-key": { value: "x" } },
					fetch: mockFetch(
						() => new Response("{not json", { headers: { "content-type": "application/json" } }),
					),
				}),
			},
		}),
	).rejects.toThrow(/invalid JSON/);

	await expect(
		renderRestricted(artifact(), {
			props: { queue: "open" },
			sources: { http: make({ data: [] }) },
		}),
	).rejects.toThrow(/pick path "items" wasn't found/);
});

test("maxRows clamps the spec limit", async () => {
	const rows = [1, 2, 3, 4, 5].map((n) => ({ title: `T${n}` }));
	const { body } = await renderRestricted(artifact(), {
		props: { queue: "open" },
		sources: {
			http: createHttpSource({
				allowOrigins: ["https://api.example.test"],
				credentials: { "corp-key": { value: "x" } },
				maxRows: 1,
				fetch: mockFetch(() => jsonResponse({ items: rows })),
			}),
		},
	});
	expect(body).toContain("T1");
	expect(body).not.toContain("T2");
});

test("private and local hosts are blocked even when allowlisted", async () => {
	for (const url of ["http://localhost:8080/x", "http://127.0.0.1/x", "http://10.0.0.5/x"]) {
		const source = compileRestricted("private", TEMPLATE, {
			requirementKinds: { http: httpRequirementKind },
			data: { t: { kind: "http", url } },
		});

		await expect(
			renderRestricted(source, {
				sources: {
					http: createHttpSource({
						allowOrigins: [new URL(url).origin],
						fetch: mockFetch(() => jsonResponse({})),
					}),
				},
			}),
		).rejects.toThrow(/private or local address/);
	}
});

test("response data is inert: markup in rows is escaped", async () => {
	const { body } = await renderRestricted(artifact(), {
		props: { queue: "open" },
		sources: {
			http: createHttpSource({
				allowOrigins: ["https://api.example.test"],
				credentials: { "corp-key": { value: "x" } },
				fetch: mockFetch(() =>
					jsonResponse({ items: [{ title: '<img src=x onerror="alert(1)">' }] }),
				),
			}),
		},
	});
	expect(body).toContain("&lt;img src=x onerror=");
	expect(body).not.toContain("<img");
});

const ROOT_SOURCE = `
export default function Inbox() {
	@render {
		@for (t of $data.payload.items) {
			<p>{t.title}</p>
		}
	}
}
`;

const ROOT_DATA: Record<string, ManifestRequirement> = {
	payload: { kind: "http", url: "https://api.example.test/tickets" },
};

test("allowFields strips disallowed fields from rows, at every level", async () => {
	const { data } = await renderRestricted(artifact(), {
		props: { queue: "open" },
		sources: {
			http: createHttpSource({
				allowOrigins: [
					{
						origin: "https://api.example.test",
						allowFields: ["items", "id", "title", "assignee", "name"],
					},
				],
				credentials: { "corp-key": { value: "x" } },
				fetch: mockFetch(() =>
					jsonResponse({
						items: [
							{ id: 1, title: "One", assignee: { name: "a", email: "a@x.test" } },
							{ id: 2, title: "Two", internal: "nope" },
						],
					}),
				),
			}),
		},
	});
	// Rows keep only allowlisted fields; nested objects are narrowed by the
	// same allowlist (assignee.email is stripped, assignee.name survives).
	expect(data.tickets).toEqual([
		{ id: 1, title: "One", assignee: { name: "a" } },
		{ id: 2, title: "Two" },
	]);
});

test("allowFields narrows the response root when there is no pick", async () => {
	const { data } = await renderRestricted(artifact(ROOT_SOURCE, ROOT_DATA), {
		sources: {
			http: createHttpSource({
				allowOrigins: [{ origin: "https://api.example.test", allowFields: ["items", "title"] }],
				fetch: mockFetch(() => jsonResponse({ meta: { total: 2 }, items: [{ title: "One" }] })),
			}),
		},
	});
	expect(data.payload).toEqual({ items: [{ title: "One" }] });
});

test("a pick into a stripped field fails loudly", async () => {
	const source = compileRestricted("stripped-pick", TEMPLATE, {
		requirementKinds: { http: httpRequirementKind },
		data: {
			t: { kind: "http", url: "https://api.example.test/tickets", pick: "items.0.internal" },
		},
	});
	await expect(
		renderRestricted(source, {
			sources: {
				http: createHttpSource({
					allowOrigins: [{ origin: "https://api.example.test", allowFields: ["items", "id"] }],
					fetch: mockFetch(() => jsonResponse({ items: [{ id: 1, internal: "nope" }] })),
				}),
			},
		}),
	).rejects.toThrow(/pick path "items\.0\.internal" wasn't found/);
});

/**
 * createHttpSource validates its options at runtime; these tests pass
 * values the types don't allow, so they arrive pre-cast.
 */
function sourceWith(allowOrigins: unknown) {
	return createHttpSource({ allowOrigins: allowOrigins as Array<string | HttpOriginPolicy> });
}

test("origin policy misconfiguration throws at creation", () => {
	expect(() => sourceWith(["https://a.test", { origin: "https://a.test" }])).toThrow(
		/more than once/,
	);
	expect(() => sourceWith([{ origin: "https://a.test", allowFields: ["__proto__"] }])).toThrow(
		/dangerous key "__proto__"/,
	);
	expect(() => sourceWith([{ origin: "https://a.test", allowFields: ["ok", 42] }])).toThrow(
		/non-empty field names/,
	);
	expect(() => sourceWith([{ allowFields: ["x"] }])).toThrow(
		/origin strings or \{ origin, allowFields \}/,
	);
});

test("deeply nested responses hit the narrowing depth cap", async () => {
	let deep: unknown = { title: "leaf" };
	for (let i = 0; i < 150; i++) deep = { inner: deep };
	await expect(
		renderRestricted(artifact(ROOT_SOURCE, ROOT_DATA), {
			sources: {
				http: createHttpSource({
					allowOrigins: [{ origin: "https://api.example.test", allowFields: ["inner"] }],
					fetch: mockFetch(() => jsonResponse(deep)),
				}),
			},
		}),
	).rejects.toThrow(/nests more than 100 levels/);
});

test("string and policy origin entries can be mixed", async () => {
	const { body } = await renderRestricted(artifact(), {
		props: { queue: "open" },
		sources: {
			http: createHttpSource({
				allowOrigins: ["https://other.test", { origin: "https://api.example.test" }],
				credentials: { "corp-key": { value: "x" } },
				fetch: mockFetch(() => jsonResponse({ items: [{ title: "One" }] })),
			}),
		},
	});
	expect(body).toContain("One");
});
