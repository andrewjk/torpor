import { expect, test } from "vite-plus/test";
import compileEmbed from "../src/server/compileEmbed";
import createServiceRenderer from "../src/server/service/createServiceRenderer";
import startRenderServer, { type RenderServer } from "../src/server/service/startRenderServer";
import type EmbedArtifact from "../src/types/EmbedArtifact";

const SOURCE = `
export default function Counter($props: { start?: number }) {
	let count = $watch({ value: $props.start ?? 0 });
	@render {
		<p>Count: {count.value}</p>
	}
}
`;

const HANGING_SOURCE = `
export default function Slow($props: {}) {
	let $state = $watch({
		get data() {
			return $async(() => new Promise(() => {}), { source: "server" });
		},
	});
	@render {
		@await {
			<p>{$state.data}</p>
		} with {
			<p>loading</p>
		}
	}
}
`;

const BOOM_SOURCE = `
export default function Boom($props: {}) {
	throw new Error("exploded during render");
	@render {
		<p>never</p>
	}
}
`;

function artifact(source = SOURCE, id = "svc-counter"): EmbedArtifact {
	return compileEmbed(id, source);
}

async function withServer(
	options: Parameters<typeof startRenderServer>[0],
	run: (server: RenderServer) => Promise<void>,
): Promise<void> {
	const server = await startRenderServer(options);
	try {
		await run(server);
	} finally {
		await server.close();
	}
}

test("renders over HTTP via the service", async () => {
	await withServer({}, async (server) => {
		const render = createServiceRenderer({ url: server.url });
		const { body, head } = await render(artifact(), { props: { start: 6 } });
		expect(body).toContain("Count: 6");
		expect(head).toBe("");
	});
});

test("exposes the service runtime version", async () => {
	await withServer({}, async (server) => {
		const response = await fetch(`${server.url}/version`);
		const payload = (await response.json()) as { version: string };
		expect(payload.version).toBe(compileEmbed("svc-version", SOURCE).version);
	});
});

test("auth: missing or wrong bearer token is rejected", async () => {
	await withServer({ token: "secret-token" }, async (server) => {
		const noAuth = await fetch(`${server.url}/render`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ artifact: artifact() }),
		});
		expect(noAuth.status).toBe(401);

		const wrongAuth = await fetch(`${server.url}/render`, {
			method: "POST",
			headers: { "content-type": "application/json", authorization: "Bearer wrong" },
			body: JSON.stringify({ artifact: artifact() }),
		});
		expect(wrongAuth.status).toBe(401);

		// The client sends the token and gets through
		const render = createServiceRenderer({ url: server.url, token: "secret-token" });
		const { body } = await render(artifact());
		expect(body).toContain("Count: 0");
	});
});

test("render errors come back as errors on the client", async () => {
	await withServer({}, async (server) => {
		const render = createServiceRenderer({ url: server.url });
		await expect(render(artifact(BOOM_SOURCE, "svc-boom"))).rejects.toThrow(
			/exploded during render/,
		);
	});
});

test("stale artifacts are rejected with the recompile message", async () => {
	await withServer({}, async (server) => {
		const render = createServiceRenderer({ url: server.url });
		const stale = artifact();
		stale.version = "0.0.0-stale";
		await expect(render(stale)).rejects.toThrow(/recompile/i);
	});
});

test("server-side timeout terminates hanging renders", async () => {
	await withServer({}, async (server) => {
		const render = createServiceRenderer({ url: server.url, timeout: 30_000 });
		await expect(render(artifact(HANGING_SOURCE, "svc-slow"), { timeout: 150 })).rejects.toThrow(
			/timed out/,
		);
	});
});

test("malformed JSON and unknown routes are rejected", async () => {
	await withServer({}, async (server) => {
		const bad = await fetch(`${server.url}/render`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: "{not json",
		});
		expect(bad.status).toBe(400);

		const missing = await fetch(`${server.url}/nope`);
		expect(missing.status).toBe(404);
	});
});

test("oversized bodies are rejected", async () => {
	await withServer({ maxBodyBytes: 64 }, async (server) => {
		const response = await fetch(`${server.url}/render`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ artifact: artifact() }),
		});
		expect(response.status).toBe(413);
	});
});

test("slots are rejected at the boundary", async () => {
	await withServer({}, async (server) => {
		const response = await fetch(`${server.url}/render`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ artifact: artifact(), slots: { default: "not-a-function" } }),
		});
		expect(response.status).toBe(400);
		expect(((await response.json()) as { error: string }).error).toContain("Slots");
	});
});
