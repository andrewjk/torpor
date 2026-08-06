import { getAllByText, queryAllByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// A `@for` list immediately followed by a sibling `@if` region. The list's
// reconciler (`runListItems`) must leave the region-chain tail pointer
// (`context.previousRegion`) pointing at the *last* item so the following
// sibling links in after the list — otherwise the sibling adopts the first
// item as its `nextRegion` and `runControlBranch` clears that item on its
// first run. These tests exercise that invariant across every reconciliation
// path (fresh mount, append, prepend, insert/remove middle, reverse, full
// replace, grow/shrink, clear, grow-from-empty) and a sibling toggle.
const source = `
export default function ForFollowedByIf($props: { items: string[], show: boolean }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				@key = item
				<li>{item}</li>
			}
		</ul>
		@if ($props.show) {
			<p>after</p>
		}
	}
}
`;

function getItems(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll("li")).map((li) => li.textContent || "");
}

function check(container: HTMLElement, items: string[], siblingPresent: boolean): void {
	expect(getItems(container)).toEqual(items);
	// The trailing sibling must survive — never duplicated or lost.
	if (siblingPresent) {
		expect(queryByText(container, "after")).not.toBeNull();
		expect(getAllByText(container, "after").length).toBe(1);
	} else {
		expect(queryAllByText(container, "after")).toEqual([]);
	}
}

function setup(items: string[], show = true) {
	const $state = $watch({ items, show });
	const container = document.createElement("div");
	return { $state, container };
}

test("for followed by if -- fresh mount keeps every item and the sibling", async () => {
	const component = await importComponent(import.meta.filename, source, "client");

	for (const mounted of [true, false]) {
		const { $state, container } = setup(["a", "b", "c"]);
		if (mounted) {
			mountComponent(container, component, $state);
		} else {
			const server = await importComponent(import.meta.filename, source, "server");
			hydrateComponent(container, component, server, $state);
		}

		check(container, ["a", "b", "c"], true);
	}
});

test("for followed by if -- append, prepend, insert and remove keep the sibling", async () => {
	const component = await importComponent(import.meta.filename, source, "client");
	const { $state, container } = setup(["b", "c"]);
	mountComponent(container, component, $state);

	$state.items = ["b", "c", "d"];
	check(container, ["b", "c", "d"], true);

	$state.items = ["a", "b", "c", "d"];
	check(container, ["a", "b", "c", "d"], true);

	$state.items = ["a", "b", "x", "c", "d"];
	check(container, ["a", "b", "x", "c", "d"], true);

	$state.items = ["a", "b", "c", "d"];
	check(container, ["a", "b", "c", "d"], true);
});

test("for followed by if -- reverse and replace keep the sibling", async () => {
	const component = await importComponent(import.meta.filename, source, "client");
	const { $state, container } = setup(["a", "b", "c", "d"]);
	mountComponent(container, component, $state);

	$state.items = [...$state.items].reverse();
	check(container, ["d", "c", "b", "a"], true);

	$state.items = ["x", "y", "z"];
	check(container, ["x", "y", "z"], true);

	$state.items = ["a", "b"];
	check(container, ["a", "b"], true);
});

test("for followed by if -- grow, shrink, clear and regrow keep the sibling", async () => {
	const component = await importComponent(import.meta.filename, source, "client");
	const { $state, container } = setup(["1"]);
	mountComponent(container, component, $state);

	$state.items = ["1", "2", "3", "4", "5"];
	check(container, ["1", "2", "3", "4", "5"], true);

	$state.items = ["1", "2"];
	check(container, ["1", "2"], true);

	$state.items = [];
	check(container, [], true);

	$state.items = ["p", "q"];
	check(container, ["p", "q"], true);
});

test("for followed by if -- toggling the sibling leaves the list intact", async () => {
	const component = await importComponent(import.meta.filename, source, "client");
	const { $state, container } = setup(["a", "b"]);
	mountComponent(container, component, $state);

	$state.show = false;
	check(container, ["a", "b"], false);

	$state.show = true;
	check(container, ["a", "b"], true);

	// Mutate the list while the sibling is absent, then bring it back.
	$state.show = false;
	$state.items = ["a", "b", "c"];
	check(container, ["a", "b", "c"], false);

	$state.show = true;
	check(container, ["a", "b", "c"], true);
});

test("for followed by if -- empty list still renders the sibling", async () => {
	const component = await importComponent(import.meta.filename, source, "client");
	const { $state, container } = setup([], true);
	mountComponent(container, component, $state);

	check(container, [], true);

	$state.items = ["only"];
	check(container, ["only"], true);
});
