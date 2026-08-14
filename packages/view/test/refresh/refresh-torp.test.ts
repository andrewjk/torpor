import { queryByText } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function RefreshTorp() {
	let fetchCount = 0;
	let $state = $watch({
		get data() {
			return $async(() => {
				const count = ++fetchCount;
				return new Promise((resolve) => {
					setTimeout(() => resolve("loaded #" + count), 10);
				});
			});
		},
	});

	function refresh() {
		$refresh(() => $state.data);
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

test("refresh button re-fetches a $async getter without a dependency change", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component);

	const { waitFor } = await import("@testing-library/dom");

	// First load: with-branch, then resolved content
	expect(queryByText(container, "Loading...")).not.toBeNull();
	await waitFor(() => expect(queryByText(container, "Result: loaded #1")).not.toBeNull());
	expect(queryByText(container, "Loading...")).toBeNull();

	// A bare refresh — no dependency changes. While the new promise is in
	// flight the boundary keeps showing the old content (stale-while-
	// revalidate) rather than flashing the with-branch.
	const button = container.getElementsByTagName("button")[0];
	await userEvent.click(button);

	expect(queryByText(container, "Loading...")).toBeNull();
	expect(queryByText(container, "Result: loaded #1")).not.toBeNull();

	// Once the new promise resolves, content updates in place
	await waitFor(() => expect(queryByText(container, "Result: loaded #2")).not.toBeNull());
	expect(queryByText(container, "Loading...")).toBeNull();
});

const spinnerSource = `
export default function RefreshSpinner() {
	let fetchCount = 0;
	let $state = $watch({
		get data() {
			return $async(() => {
				const count = ++fetchCount;
				return new Promise((resolve) => {
					setTimeout(() => resolve("loaded #" + count), 10);
				});
			});
		},
	});

	function refresh() {
		$refresh(() => $state.data);
	}

	@render {
		@await {
			<p>Result: {$state.data}</p>
		} with {
			<p>Loading...</p>
		}
		@if ($pending(() => $state.data)) {
			<p class="spinner">Updating...</p>
		}
		<button onclick={refresh}>refresh</button>
	}
}
`;

test("refresh is loud by default — $pending drives an inline spinner while in flight", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, spinnerSource, "client");
	mountComponent(container, component);

	const { waitFor } = await import("@testing-library/dom");

	// First load: with-branch → content; the first-load pending shows the spinner
	// but it disappears once content arrives.
	expect(queryByText(container, "Loading...")).not.toBeNull();
	await waitFor(() => expect(queryByText(container, "Result: loaded #1")).not.toBeNull());
	expect(queryByText(container, "Updating...")).toBeNull();

	// A loud refresh: the spinner appears immediately while the fetch is in
	// flight, and the stale content stays visible.
	const button = container.getElementsByTagName("button")[0];
	await userEvent.click(button);

	expect(queryByText(container, "Updating...")).not.toBeNull();
	expect(queryByText(container, "Result: loaded #1")).not.toBeNull();
	expect(queryByText(container, "Loading...")).toBeNull();

	// After resolve, the spinner disappears and content updates in place
	await waitFor(() => expect(queryByText(container, "Result: loaded #2")).not.toBeNull());
	expect(queryByText(container, "Updating...")).toBeNull();
});

const skeletonSource = `
export default function RefreshSkeleton() {
	let fetchCount = 0;
	let $state = $watch({
		get data() {
			return $async(() => {
				const count = ++fetchCount;
				return new Promise((resolve) => {
					setTimeout(() => resolve("loaded #" + count), 10);
				});
			});
		},
	});

	function refresh() {
		$refresh(() => $state.data);
	}

	@render {
		@await {
			@if ($pending(() => $state.data)) {
				<p class="spinner">Updating...</p>
			}
			<p>Result: {$state.data}</p>
		} with {
			<p class="skeleton">Loading...</p>
		}
		<button onclick={refresh}>refresh</button>
	}
}
`;

test("skeleton on load, spinner on refresh — the spinner lives inside the content branch", async () => {
	// The skeleton/spinner split doesn't need a mode flag on $pending: put the
	// $pending spinner inside the @await content branch. On first load the
	// content branch is discarded in favor of the with-branch (skeleton), so only
	// the skeleton shows; on a refresh the content stays mounted and the
	// spinner appears.
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, skeletonSource, "client");
	mountComponent(container, component);

	const { waitFor } = await import("@testing-library/dom");

	// First load: skeleton only — the spinner (part of the discarded content
	// branch) must not show.
	expect(queryByText(container, "Loading...")).not.toBeNull();
	expect(queryByText(container, "Updating...")).toBeNull();
	await waitFor(() => expect(queryByText(container, "Result: loaded #1")).not.toBeNull());
	expect(queryByText(container, "Loading...")).toBeNull();
	expect(queryByText(container, "Updating...")).toBeNull();

	// Refresh: content stays, spinner appears, skeleton stays gone.
	const button = container.getElementsByTagName("button")[0];
	await userEvent.click(button);

	expect(queryByText(container, "Updating...")).not.toBeNull();
	expect(queryByText(container, "Result: loaded #1")).not.toBeNull();
	expect(queryByText(container, "Loading...")).toBeNull();

	// Resolve: spinner gone, content updated.
	await waitFor(() => expect(queryByText(container, "Result: loaded #2")).not.toBeNull());
	expect(queryByText(container, "Updating...")).toBeNull();
});

const selfDisablingSource = `
export default function SelfDisablingRefresh() {
	let fetchCount = 0;
	let $state = $watch({
		get users() {
			return $async(() => {
				const count = ++fetchCount;
				return new Promise((resolve) => {
					setTimeout(() => resolve("users #" + count), 10);
				});
			});
		},
	});

	@render {
		<p>Users: {$state.users}</p>
		<button
			onclick={() => $refresh(() => $state.users)}
			disabled={$pending(() => $state.users)}
		>
			refresh
		</button>
	}
}
`;

test("refresh button that disables itself with $pending", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, selfDisablingSource, "client");
	mountComponent(container, component);

	const { waitFor } = await import("@testing-library/dom");

	// Disabled during the initial load, enabled once data arrives
	const button = container.getElementsByTagName("button")[0] as HTMLButtonElement;
	expect(button.disabled).toBe(true);
	await waitFor(() => expect(button.disabled).toBe(false));
	expect(queryByText(container, "Users: users #1")).not.toBeNull();

	// Click → refresh starts, button disables itself while in flight, stale
	// content stays visible
	await userEvent.click(button);
	expect(button.disabled).toBe(true);
	expect(queryByText(container, "Users: users #1")).not.toBeNull();

	// Resolve → button re-enables, content updated
	await waitFor(() => expect(queryByText(container, "Users: users #2")).not.toBeNull());
	expect(button.disabled).toBe(false);
});
