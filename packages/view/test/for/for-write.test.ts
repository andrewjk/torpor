import { queryByTestId, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Row {
	id: number;
	done: boolean;
	label: string;
}

interface Props {
	rows: Row[];
}

// A property write to a loop var (`&value={row.label}`) must not force the
// textual data-path substitution: the write mutates the row object through the
// shadowed reference. `row` stays shadow-bound, so its reads are lexical.
const source = `
export default function ForWrite($props: { rows: Props["rows"] }) {
	@render {
		<ul>
			@for (let row of $props.rows) {
				@key = row.id
				<li data-testid={row.label}>
					<input type="checkbox" &checked={row.done} />
					{row.done ? "done" : "todo"}:{row.label}
				</li>
			}
		</ul>
	}
}
`;

function makeState(): Props {
	return {
		rows: [
			{ id: 1, done: false, label: "a" },
			{ id: 2, done: false, label: "b" },
		],
	};
}

test("for property writes stay shadow-bound -- mounted", async () => {
	let $state = $watch(makeState());

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	await check(container, $state);
});

test("for property writes stay shadow-bound -- hydrated", async () => {
	let $state = $watch(makeState());

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	await check(container, $state);
});

async function check(container: HTMLElement, state: Props) {
	expect(queryByText(container, "todo:a")).not.toBeNull();
	expect(queryByText(container, "todo:b")).not.toBeNull();

	// Toggling the bound checkbox writes `row.done` through the shadowed
	// (deep-proxied) row, and the text effect re-runs.
	const a = queryByTestId(container, "a")!;
	const checkbox = a.querySelector('input[type="checkbox"]') as HTMLInputElement;
	await userEvent.click(checkbox);

	expect(checkbox.checked).toBe(true);
	expect(queryByText(container, "done:a")).not.toBeNull();

	// Replacing the rows (reference change) must keep the handlers live: the
	// write has to reach the *new* row object, not a captured stale one.
	state.rows = [
		{ id: 1, done: false, label: "a" },
		{ id: 2, done: false, label: "b" },
	];

	expect(queryByText(container, "todo:a")).not.toBeNull();

	const a2 = queryByTestId(container, "a")!;
	const checkbox2 = a2.querySelector('input[type="checkbox"]') as HTMLInputElement;
	await userEvent.click(checkbox2);

	expect(checkbox2.checked).toBe(true);
	expect(queryByText(container, "done:a")).not.toBeNull();
}
