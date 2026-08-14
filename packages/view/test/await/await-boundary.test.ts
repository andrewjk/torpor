import { queryByText } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function AwaitTest() {
	let $state = $watch({
		version: 0,
		get data() {
			return $async(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve("loaded v" + $state.version), 10);
					}),
			);
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

test("@await shows the with-branch then content -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	// Initially suspended → with-branch
	expect(queryByText(container, "Loading...")).not.toBeNull();
	expect(queryByText(container, "Result: loaded v0")).toBeNull();

	// After promise resolves → content
	const { waitFor } = await import("@testing-library/dom");
	await waitFor(() => expect(queryByText(container, "Result: loaded v0")).not.toBeNull());
	expect(queryByText(container, "Loading...")).toBeNull();
});

test("@await without a with-branch shows nothing while suspended", async () => {
	const sourceNoFallback = `
	export default function AwaitNoWith() {
		let $state = $watch({
			get data() {
				return $async(() => Promise.resolve("quick"));
			},
		});

		@render {
			@await {
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

test("@await hydrated shows the with-branch then content", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	// Server renders the with-branch; client hydrates and eventually shows content
	const { waitFor } = await import("@testing-library/dom");
	await waitFor(() => expect(queryByText(container, "Result: loaded v0")).not.toBeNull());
});

const twoListsSource = `
export default function AwaitTwoLists() {
	let $state = $watch({
		get listA() {
			return $async(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve("A loaded"), 10);
					}),
			);
		},
		get listB() {
			return $async(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve("B loaded"), 20);
					}),
			);
		},
	});

	@render {
		@await {
			<p>A: {$state.listA}</p>
		} with {
			<p>Loading A...</p>
		}
		@await {
			<p>B: {$state.listB}</p>
		} with {
			<p>Loading B...</p>
		}
	}
}
`;

test("sibling @await boundaries are independent per async getter", async () => {
	// One boundary tracks every $async read inside its OWN subtree, not the
	// whole component. Two sibling boundaries — one per filtered list — give
	// each its own with-branch and resolve independently.
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, twoListsSource, "client");
	mountComponent(container, component);

	const { waitFor } = await import("@testing-library/dom");

	// Both lists load independently
	expect(queryByText(container, "Loading A...")).not.toBeNull();
	expect(queryByText(container, "Loading B...")).not.toBeNull();

	// A resolves first; B keeps its own with-branch
	await waitFor(() => expect(queryByText(container, "A: A loaded")).not.toBeNull());
	expect(queryByText(container, "Loading A...")).toBeNull();
	expect(queryByText(container, "Loading B...")).not.toBeNull();
	expect(queryByText(container, "B: B loaded")).toBeNull();

	// B resolves independently
	await waitFor(() => expect(queryByText(container, "B: B loaded")).not.toBeNull());
	expect(queryByText(container, "Loading B...")).toBeNull();
});

const staleSource = `
export default function AwaitStale() {
	let $state = $watch({
		version: 0,
		get data() {
			return $async(() => {
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
		@await {
			<p>Result: {$state.data}</p>
		} with {
			<p>Loading...</p>
		}
		<button onclick={refresh}>refresh</button>
	}
}
`;

test("@await keeps stale content during a refresh instead of flashing the with-branch", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, staleSource, "client");
	mountComponent(container, component);

	const { waitFor } = await import("@testing-library/dom");

	// First load: with-branch, then resolved content
	expect(queryByText(container, "Loading...")).not.toBeNull();
	await waitFor(() => expect(queryByText(container, "Result: loaded v0")).not.toBeNull());
	expect(queryByText(container, "Loading...")).toBeNull();

	// Trigger a refresh (dependency change → re-fetch). While the new promise
	// is in flight the boundary must keep showing the old resolved content
	// (stale-while-revalidate) rather than flashing the with-branch.
	const button = container.getElementsByTagName("button")[0];
	await userEvent.click(button);

	expect(queryByText(container, "Loading...")).toBeNull();
	expect(queryByText(container, "Result: loaded v0")).not.toBeNull();

	// Once the new promise resolves, content updates in place
	await waitFor(() => expect(queryByText(container, "Result: loaded v1")).not.toBeNull());
	expect(queryByText(container, "Loading...")).toBeNull();
});
