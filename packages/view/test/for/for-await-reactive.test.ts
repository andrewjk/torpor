import "@testing-library/jest-dom/vitest";
import { waitFor } from "@testing-library/dom";
import { expect, test } from "vite-plus/test";
import $async from "../../src/watch/$async";
import $watch from "../../src/watch/$watch";
import assertRegionChain from "../assertRegionChain";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// An `@await` boundary inside a keyed `@for`: rows render their `with`
// branch at mount, then render content when the shared `$async` getter
// resolves — a later branch render inserted at each row's anchor (runAwait,
// not runControl). List updates (append/remove/clear) while rows are pending
// and after they resolve must not orphan branch content or corrupt the
// chain.

const source = `
export default function ForAwaitReactive($props: { ids: number[]; loaded: string }) {
	@render {
		<ul>
			@for (let id of $props.ids) {
				@key = id
				@await {
					<li class="ok">{id} {$props.loaded}</li>
				} with {
					<li class="loading">{id} loading</li>
				}
			}
		</ul>
		<footer>after</footer>
	}
}
`;

function rows(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll("li")).map(
		(li) => `${li.className}:${li.textContent?.trim()}`,
	);
}

test("await in keyed for resolves and updates without orphans", async () => {
	let currentResolve!: (value: string) => void;
	let $state = $watch({
		ids: [1, 2] as number[],
		get loaded(): string {
			return $async(
				() =>
					new Promise<string>((resolve) => {
						currentResolve = resolve;
					}),
			);
		},
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	// Both rows show the with-branch while pending
	assertRegionChain();
	expect(rows(container)).toEqual(["loading:1 loading", "loading:2 loading"]);

	// Append a row while the fetch is still pending — the new row mounts
	// into the with-branch too
	$state.ids = [1, 2, 3];
	assertRegionChain();
	expect(rows(container)).toEqual(["loading:1 loading", "loading:2 loading", "loading:3 loading"]);

	// Resolve: every row's await switches to its content branch — content
	// inserted at each row's anchor
	currentResolve("done");
	await waitFor(() => expect(rows(container)[0]).toBe("ok:1 done"));
	assertRegionChain();
	expect(rows(container)).toEqual(["ok:1 done", "ok:2 done", "ok:3 done"]);

	// Remove a resolved row
	$state.ids = [2, 3];
	assertRegionChain();
	expect(rows(container)).toEqual(["ok:2 done", "ok:3 done"]);

	// Clear all — resolved content must be removed too (the orphan check)
	$state.ids = [];
	assertRegionChain();
	expect(container.querySelectorAll("li").length).toBe(0);
	expect(container.querySelector("footer")).toHaveTextContent("after");
});
