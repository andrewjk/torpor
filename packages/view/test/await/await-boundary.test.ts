import { queryByText } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
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
	await hydrateComponent(container, clientComponent, serverComponent);

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

const multiPendingSource = `
export default function AwaitMultiPending() {
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
						setTimeout(() => resolve("B loaded"), 30);
					}),
			);
		},
	});

	@render {
		@await {
			<p>A: {$state.listA}</p>
			<p>B: {$state.listB}</p>
		} with {
			<p>Loading...</p>
		}
	}
}
`;

test("single boundary with two pending reads stays on the with-branch until both resolve", async () => {
	// A boundary commits content only when no read inside suspends (ASYNC.md
	// → "Stale-while-revalidate"). When the first promise resolves, the boundary must re-run,
	// re-check its remaining pending read, and keep the with-branch — without
	// losing its subscription to the still-pending computed (a no-op re-run
	// deactivates all source subscriptions; they must be re-established or
	// the boundary never re-runs when the second promise resolves).
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, multiPendingSource, "client");
	mountComponent(container, component);

	const { waitFor } = await import("@testing-library/dom");

	// Both pending -> with-branch
	expect(queryByText(container, "Loading...")).not.toBeNull();

	// A resolves at 10ms; B still pending -> still Loading
	await new Promise((r) => setTimeout(r, 25));
	expect(queryByText(container, "Loading...")).not.toBeNull();
	expect(queryByText(container, "A: A loaded")).toBeNull();

	// B resolves at 30ms -> content shows both, with-branch gone
	await waitFor(() => expect(queryByText(container, "A: A loaded")).not.toBeNull());
	expect(queryByText(container, "B: B loaded")).not.toBeNull();
	expect(queryByText(container, "Loading...")).toBeNull();
});

const fineGrainedSource = `
export default function AwaitFineGrained($props: { toggle: boolean }) {
	let $state = $watch({
		get data() {
			return $async(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve("loaded"), 10);
					}),
			);
		},
	});

	@render {
		@await {
			<p>Result: {$state.data} <span class="flag">{$props.toggle}</span></p>
		} with {
			<p>Loading...</p>
		}
	}
}
`;

test("non-suspend state changes update content in place without re-running the boundary", async () => {
	// A toggle read inside content is handled by the child effect that read
	// it — the boundary must not flash the with-branch or re-render content.
	let $props = $watch({ toggle: false });
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, fineGrainedSource, "client");
	mountComponent(container, component, $props);

	const { waitFor } = await import("@testing-library/dom");

	// First load: with-branch, then content
	expect(queryByText(container, "Loading...")).not.toBeNull();
	const flag = () => container.getElementsByClassName("flag")[0].textContent;
	const paragraph = () => container.getElementsByTagName("p")[0];
	await waitFor(() => expect(paragraph().textContent).toContain("loaded"));
	expect(flag()).toBe("false");
	expect(queryByText(container, "Loading...")).toBeNull();

	// Toggle while content is shown — the child effect patches the span in
	// place; the boundary must not re-render (same <p> node) or flash Loading
	const paragraphBefore = paragraph();
	$props.toggle = true;
	await waitFor(() => expect(flag()).toBe("true"));
	expect(queryByText(container, "Loading...")).toBeNull();
	expect(paragraph()).toBe(paragraphBefore);
});

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

const rapidSource = `
export default function AwaitRapid() {
	let $state = $watch({
		version: 0,
		get data() {
			return $async(() => {
				// Read version synchronously so the computed tracks it
				const version = $state.version;
				// v1 is deliberately slow, so it is still in flight when the
				// next change lands
				const delay = version === 1 ? 100 : 10;
				return new Promise((resolve) => {
					setTimeout(() => resolve("loaded v" + version), delay);
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

test("rapid prop changes never render a superseded fetch's in-flight promise", async () => {
	// Stale-while-revalidate retains the last RESOLVED value for readers
	// during a refresh. When changes overlap — a re-suspend while an earlier
	// fetch is still in flight — the retained value must still be that last
	// resolved value, never the previous run's pending promise (which would
	// render as "[object Promise]"): the generation guard drops the stale
	// RESOLVE, but the read-side token must be just as generation-safe.
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, rapidSource, "client");
	mountComponent(container, component);

	const { waitFor } = await import("@testing-library/dom");

	// First load: with-branch, then resolved content
	expect(queryByText(container, "Loading...")).not.toBeNull();
	await waitFor(() => expect(queryByText(container, "Result: loaded v0")).not.toBeNull());

	const button = container.getElementsByTagName("button")[0];

	// Change #1: starts a slow (100ms) fetch
	await userEvent.click(button);
	// Stale content stays mounted while the slow fetch is in flight
	expect(queryByText(container, "Result: loaded v0")).not.toBeNull();

	// Change #2 lands while change #1's fetch is still pending. This re-runs
	// the computed while its value holds change #1's PROMISE — the boundary
	// must keep showing the last resolved content, not that promise
	await userEvent.click(button);
	expect(queryByText(container, "Result: loaded v0")).not.toBeNull();
	expect(container.textContent).not.toContain("[object Promise]");

	// The fast fetch for change #2 resolves and updates in place
	await waitFor(() => expect(queryByText(container, "Result: loaded v2")).not.toBeNull());
	expect(container.textContent).not.toContain("[object Promise]");

	// The superseded slow fetch eventually resolves but must be dropped
	await new Promise((r) => setTimeout(r, 120));
	expect(queryByText(container, "Result: loaded v2")).not.toBeNull();
	expect(container.textContent).not.toContain("loaded v1");
	expect(container.textContent).not.toContain("[object Promise]");
});
