import { queryByTestId, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

interface Row {
	name: string;
	ok: boolean;
	tags: { ok: boolean }[];
}

interface Props {
	rows: Row[];
}

// `row` is the outer loop variable, and the inner `.filter(row => row.ok)`
// shadows it — the old textual substitution rewrote the arrow parameter to
// the data path and broke. The `&&`/no-space operators were blind spots of
// that same text scan too.
const source = `
export default function ForShadow($props: { rows: Props["rows"] }) {
	@render {
		<ul>
			@for (let row of $props.rows) {
				<li data-testid={row.name}>
					{row.ok&&"Y"||"N"}:{row.name}:{row.tags.filter(row=>row.ok).length}
				</li>
			}
		</ul>
	}
}
`;

function makeState(): Props {
	return {
		rows: [
			{ name: "a", ok: true, tags: [{ ok: true }, { ok: false }] },
			{ name: "b", ok: false, tags: [{ ok: true }] },
		],
	};
}

test("for shadowing and no-space operators -- mounted", async () => {
	let $state = $watch(makeState());

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	check(container, $state);
});

test("for shadowing and no-space operators -- hydrated", async () => {
	let $state = $watch(makeState());

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	check(container, $state);
});

function check(container: HTMLElement, state: Props) {
	const a = queryByTestId(container, "a");
	expect(a).not.toBeNull();
	expect(a!.textContent).toContain("Y:a:1");

	const b = queryByTestId(container, "b");
	expect(b).not.toBeNull();
	expect(b!.textContent).toContain("N:b:1");

	// A reference update must re-run the effect against the fresh loop var.
	state.rows = [{ name: "a", ok: false, tags: [{ ok: true }, { ok: true }] }];

	expect(queryByTestId(container, "b")).toBeNull();
	const updated = queryByTestId(container, "a");
	expect(updated).not.toBeNull();
	expect(updated!.textContent).toContain("N:a:2");
	expect(queryByText(container, "Y:a:1")).toBeNull();
}
