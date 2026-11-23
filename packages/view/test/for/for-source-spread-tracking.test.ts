import { queryAllByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Props {
	filter: string;
	rows: { n: number }[];
}

const source = `
export default function Component($props: { filter: string, rows: { n: number }[] }) {
	function filtered() {
		const all = [...$props.rows];
		return $props.filter === "even" ? all.filter((r) => r.n % 2 === 0) : all;
	}

	@render {
		<ul>
			@for (let row of filtered()) {
				<li>{row.n}</li>
			}
		</ul>
	}
}
`;

// Regression test: a list whose source function iterates a watched array
// (spread / `for…of` / `Array.from`) and then reads other watched state used
// to stop tracking after the iteration — the array iterator cleared the
// active effect and never restored it — so changing the filter never
// re-rendered the list.
test("list re-runs when state read after iterating its source changes -- mounted", async () => {
	let $state: Props = $watch({ filter: "even", rows: [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }] });

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("list re-runs when state read after iterating its source changes -- hydrated", async () => {
	let $state: Props = $watch({ filter: "even", rows: [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }] });

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	expect(queryAllByText(container, "2").length).toBe(1);
	expect(queryAllByText(container, "4").length).toBe(1);
	expect(queryAllByText(container, "1").length).toBe(0);

	// The filter is read AFTER the spread in `filtered()` — the list must
	// still track it and re-render
	state.filter = "all";
	expect(queryAllByText(container, "1").length).toBe(1);
	expect(queryAllByText(container, "3").length).toBe(1);

	// And the array itself stays tracked
	state.rows.push({ n: 6 });
	expect(queryAllByText(container, "6").length).toBe(1);
}
