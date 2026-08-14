import { queryByText } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function LoadingTest() {
	let $state = $watch({
		version: 0,
		get data() {
			return $await(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve("loaded v" + $state.version), 10);
					}),
			);
		},
	});

	@render {
		@loading {
			<p>Result: {$state.data}</p>
		} @fallback {
			<p>Loading...</p>
		}
	}
}
`;

test("@loading shows fallback then content -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	// Initially suspended → fallback
	expect(queryByText(container, "Loading...")).not.toBeNull();
	expect(queryByText(container, "Result: loaded v0")).toBeNull();

	// After promise resolves → content
	const { waitFor } = await import("@testing-library/dom");
	await waitFor(() => expect(queryByText(container, "Result: loaded v0")).not.toBeNull());
	expect(queryByText(container, "Loading...")).toBeNull();
});

test("@loading without fallback shows nothing while suspended", async () => {
	const sourceNoFallback = `
	export default function LoadingNoFallback() {
		let $state = $watch({
			get data() {
				return $await(() => Promise.resolve("quick"));
			},
		});

		@render {
			@loading {
				<p>Value: {$state.data}</p>
			}
		}
	}
	`;
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, sourceNoFallback, "client");
	mountComponent(container, component);

	// While suspended, no content visible
	expect(queryByText(container, "Value: quick")).toBeNull();

	const { waitFor } = await import("@testing-library/dom");
	await waitFor(() => expect(queryByText(container, "Value: quick")).not.toBeNull());
});

test("@loading hydrated shows fallback then content", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	// Server renders fallback; client hydrates and eventually shows content
	const { waitFor } = await import("@testing-library/dom");
	await waitFor(() => expect(queryByText(container, "Result: loaded v0")).not.toBeNull());
});

const staleSource = `
export default function LoadingStale() {
	let $state = $watch({
		version: 0,
		get data() {
			return $await(() => {
				// Read version synchronously so the computed tracks it and
				// re-fetches when it changes (reading inside setTimeout would
				// run in an untracked context).
				const version = $state.version;
				return new Promise((resolve) => {
					setTimeout(() => resolve("loaded v" + version), 10);
				});
			});
		},
	});

	function refresh() {
		$state.version++;
	}

	@render {
		@loading {
			<p>Result: {$state.data}</p>
		} @fallback {
			<p>Loading...</p>
		}
		<button onclick={refresh}>refresh</button>
	}
}
`;

test("@loading keeps stale content during a refresh instead of flashing fallback", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, staleSource, "client");
	mountComponent(container, component);

	const { waitFor } = await import("@testing-library/dom");

	// First load: fallback, then resolved content
	expect(queryByText(container, "Loading...")).not.toBeNull();
	await waitFor(() => expect(queryByText(container, "Result: loaded v0")).not.toBeNull());
	expect(queryByText(container, "Loading...")).toBeNull();

	// Trigger a refresh (dependency change → re-fetch). While the new promise
	// is in flight the boundary must keep showing the old resolved content
	// (stale-while-revalidate) rather than flashing fallback.
	const button = container.getElementsByTagName("button")[0];
	await userEvent.click(button);

	expect(queryByText(container, "Loading...")).toBeNull();
	expect(queryByText(container, "Result: loaded v0")).not.toBeNull();

	// Once the new promise resolves, content updates in place
	await waitFor(() => expect(queryByText(container, "Result: loaded v1")).not.toBeNull());
	expect(queryByText(container, "Loading...")).toBeNull();
});
