import { queryByText } from "@testing-library/dom";
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

// TODO: @loading hydration — server renders fallback, client must hydrate
// against it before attempting content. Needs hydration-aware handling in
// runLoading (like runControl's hydration cursor reset).
test.skip("@loading hydrated shows fallback then content", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent);

	// Server renders fallback; client hydrates and eventually shows content
	const { waitFor } = await import("@testing-library/dom");
	await waitFor(() => expect(queryByText(container, "Result: loaded v0")).not.toBeNull());
});
