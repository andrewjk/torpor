import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";

const source = `
export default function ServerAsync($props: { version: number }) {
	let $state = $watch({
		get data() {
			return $async(() => {
				// Read synchronously so the fetch re-runs when version changes
				const version = $props.version;
				return new Promise((resolve) => {
					setTimeout(() => resolve("data v" + version), 10);
				});
			}, { source: "server" });
		},
	});

	@render {
		@await {
			<p>Result: {$state.data}</p>
		} with {
			<p>Loading...</p>
		}
	}
}
`;

test("source: server ships resolved content with embedded values", async () => {
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	const { body } = await serverComponent({ version: 3 });

	// The content branch ships resolved; the with branch never renders
	expect(body).toContain("Result: data v3");
	expect(body).toContain("data v3");
	expect(body).toContain("<!--t-await:");
	expect(body).not.toContain("Loading");
});

test("hydration adopts the server content with no fallback flash", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $watch({ version: 3 }));

	// The server's value is there immediately -- no with-branch flash, no
	// waiting for the client fetch
	expect(queryByText(container, "Loading...")).toBeNull();
	expect(queryByText(container, "Result: data v3")).not.toBeNull();

	// The background fetch the client ran to track dependencies is dropped
	// (generation guard), so the server's value stays on screen
	await new Promise((resolve) => setTimeout(resolve, 60));
	expect(queryByText(container, "Result: data v3")).not.toBeNull();
	expect(queryByText(container, "Loading...")).toBeNull();
});

test("a dependency change after hydration re-fetches", async () => {
	const container = document.createElement("div");
	const $state = $watch({ version: 3 });
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);
	expect(queryByText(container, "Result: data v3")).not.toBeNull();

	$state.version = 4;
	const { waitFor } = await import("@testing-library/dom");
	await waitFor(() => expect(queryByText(container, "Result: data v4")).not.toBeNull());
});

const slowSource = `
export default function ServerAsyncSlow() {
	let $state = $watch({
		get data() {
			return $async(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve("slow data"), 200);
					}),
				{ source: "server", timeout: 20 },
			);
		},
	});

	@render {
		@await {
			<p>Value: {$state.data}</p>
		} with {
			<p>Loading slow...</p>
		}
	}
}
`;

test("a slow server fetch degrades to the with branch and the client fetches", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, slowSource, "client");
	const serverComponent = await importComponent(import.meta.filename, slowSource, "server");
	const { body } = await serverComponent(undefined);

	// The server gave up inside the timeout: with branch + client fetch
	expect(body).toContain("Loading slow...");
	expect(body).not.toContain("slow data");
	expect(body).not.toContain("<!--t-await:");

	await hydrateComponent(container, clientComponent, serverComponent);
	expect(queryByText(container, "Loading slow...")).not.toBeNull();

	const { waitFor } = await import("@testing-library/dom");
	await waitFor(() => expect(queryByText(container, "Value: slow data")).not.toBeNull());
});

const parallelSource = `
export default function ServerAsyncParallel() {
	let $state = $watch({
		times: [] as number[],
		get a() {
			return $async(() => fetchA(), { source: "server" });
		},
		get b() {
			return $async(() => fetchB(), { source: "server" });
		},
	});

	@render {
		@await {
			<p>{$state.a} and {$state.b}</p>
		} with {
			<p>Loading parallel...</p>
		}
	}
}
`;

test("sibling server reads in one boundary start together", async () => {
	const starts: number[] = [];
	(globalThis as any).fetchA = () => {
		starts.push(Date.now());
		return new Promise((resolve) => setTimeout(() => resolve("A"), 80));
	};
	(globalThis as any).fetchB = () => {
		starts.push(Date.now());
		return new Promise((resolve) => setTimeout(() => resolve("B"), 80));
	};

	const serverComponent = await importComponent(import.meta.filename, parallelSource, "server");
	const { body } = await serverComponent(undefined);

	expect(body).toContain("A and B");
	// Both reads recorded in read order for the hydration payload
	expect(body).toContain(`<!--t-await:["A","B"]-->`);
	// A serial render would wait for A to settle before starting B (>= 80ms
	// apart); a parallel wave starts them together
	expect(starts.length).toBe(2);
	expect(Math.abs(starts[0] - starts[1])).toBeLessThan(40);

	delete (globalThis as any).fetchA;
	delete (globalThis as any).fetchB;
});

const nestedSource = `
export default function ServerAsyncOuter() {
	let $state = $watch({
		get outer() {
			return $async(() => Promise.resolve("outer"), { source: "server" });
		},
	});

	@render {
		@await {
			<p>{$state.outer}</p>
			@await {
				<p>{$state.outer} inner</p>
			} with {
				<p>Inner loading...</p>
			}
		} with {
			<p>Outer loading...</p>
		}
	}
}
`;

test("nested server boundaries both ship resolved content", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, nestedSource, "client");
	const serverComponent = await importComponent(import.meta.filename, nestedSource, "server");
	const { body } = await serverComponent(undefined);

	expect(body).toContain("outer");
	expect(body).toContain("outer inner");
	expect(body).not.toContain("loading");

	await hydrateComponent(container, clientComponent, serverComponent);
	expect(queryByText(container, "outer")).not.toBeNull();
	expect(queryByText(container, "outer inner")).not.toBeNull();
});

const rejectSource = `
export default function ServerAsyncReject() {
	let $state = $watch({
		get data() {
			return $async(() => Promise.reject(new Error("boom")), { source: "server" });
		},
	});

	@render {
		@try {
			@await {
				<p>Value: {$state.data}</p>
			} with {
				<p>Loading reject...</p>
			}
		} catch (err) {
			<p>Caught: {err.message}</p>
		}
	}
}
`;

test("a rejecting server read degrades and the client renders the catch branch", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, rejectSource, "client");
	const serverComponent = await importComponent(import.meta.filename, rejectSource, "server");
	const { body } = await serverComponent(undefined);

	// A rejection can't be positioned in the server HTML (the boundary's
	// lifecycle runs detached), so the boundary degrades to its with branch
	// and the error surfaces on the client, where `@try` catches it
	expect(body).toContain("Loading reject");

	await hydrateComponent(container, clientComponent, serverComponent);
	const { waitFor } = await import("@testing-library/dom");
	await waitFor(() => expect(queryByText(container, "Caught: boom")).not.toBeNull());
});

const mixedSource = `
export default function ServerAsyncMixed() {
	let $state = $watch({
		get serverData() {
			return $async(() => Promise.resolve("from server"), { source: "server" });
		},
		get clientData() {
			return $async(() => Promise.resolve("from client"));
		},
	});

	@render {
		@await {
			<p>{$state.serverData} / {$state.clientData}</p>
		} with {
			<p>Loading mixed...</p>
		}
	}
}
`;

test("a client-fetch read in the boundary degrades to the with branch", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, mixedSource, "client");
	const serverComponent = await importComponent(import.meta.filename, mixedSource, "server");
	const { body } = await serverComponent(undefined);

	// The client will suspend on clientData, so resolved content can't ship
	expect(body).toContain("Loading mixed...");
	expect(body).not.toContain("from server");
	expect(body).not.toContain("<!--t-await:");

	await hydrateComponent(container, clientComponent, serverComponent);
	const { waitFor } = await import("@testing-library/dom");
	await waitFor(() => expect(queryByText(container, "from server / from client")).not.toBeNull());
});
