import { expect, test } from "vite-plus/test";
import fs from "node:fs";
import path from "node:path";
import { buildFiles2 } from "../buildOutputFiles";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// When a `@for` body is classified "no-proxy safe", the compiler emits
// `forVarDeps` on each effect (listing the loop-vars its body reads) and
// the `updateListItem` callback passes only the *changed* for-vars to
// `t_rerun_region_effects`. Effects that don't depend on any changed for-var
// are skipped, and mount effects are always skipped.
//
// These tests pin both the compiled output (correct annotations) and the
// runtime behaviour (mount effects don't re-fire, text effects do update).

const source = `
export default function ForVarDeps($props: { items: Array<{ id: number, label: string }> }) {
	@render {
		<ul>
			@for (let row of $props.items) {
				@key = row.id
				<li>{row.label}</li>
			}
		</ul>
	}
}
`;

async function compileAndGet(src: string): Promise<string> {
	const componentPath = path.join(
		path.dirname(import.meta.filename),
		"components",
		"ForVarDeps.torp",
	);
	const built = await buildFiles2(componentPath, src);
	return fs.readFileSync(built.client!, "utf8");
}

test("no-proxy for emits forVarMask on text effect", async () => {
	const compiled = await compileAndGet(source);

	// The text interpolation effect must carry `forVarMask: 1` (bit 0 set =
	// depends on the first/only for-var "row").
	expect(compiled).toContain("forVarMask: 1");

	// The updateListItem must use the bitmask and pass it.
	expect(compiled).toContain("t_changed_mask");
	expect(compiled).toContain("t_changed_mask = 1");
	expect(compiled).toContain("t_rerun_region_effects(t_old_item, t_changed_mask)");
});

test("no-proxy for re-runs text effect when for-var changes", async () => {
	let $state = $watch({
		items: [
			{ id: 1, label: "a" },
			{ id: 2, label: "b" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	const labels = () =>
		Array.from(container.querySelectorAll("li")).map((li) => li.textContent?.trim() || "");

	expect(labels()).toEqual(["a", "b"]);

	$state.items = [
		{ id: 1, label: "A" },
		{ id: 2, label: "B" },
	];
	expect(labels()).toEqual(["A", "B"]);
});

test("no-proxy for re-runs text effect when for-var changes -- hydrated", async () => {
	let $state = $watch({
		items: [
			{ id: 1, label: "a" },
			{ id: 2, label: "b" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	$state.items = [
		{ id: 1, label: "A" },
		{ id: 2, label: "B" },
	];

	const labels = () =>
		Array.from(container.querySelectorAll("li")).map((li) => li.textContent?.trim() || "");

	expect(labels()).toEqual(["A", "B"]);
});

// Multi-var: when the for body destructures two loop vars and only reads
// one of them in the text, the fragment's combined $run gets forVarDeps
// listing only the var(s) actually read.
const multiVarSource = `
export default function ForVarDeps($props: { items: Array<{ id: number, a: string, b: string }> }) {
	@render {
		<ul>
			@for (let { id, a, b } of $props.items) {
				@key = id
				<li>{a}</li>
			}
		</ul>
	}
}
`;

test("no-proxy multi-var for only lists read for-vars in forVarMask", async () => {
	const compiled = await compileAndGet(multiVarSource);

	// The text effect reads `a` only. In the destructuring `{ id, a, b }`,
	// forVarNames = ["id", "a", "b"], so `a` is at bit 1 (1 << 1 = 2).
	// forVarMask must be exactly 2 — not 1 (id) or 4 (b).
	expect(compiled).toContain("forVarMask: 2");

	// The updateListItem sets bits per for-var position:
	// id=bit0(1), a=bit1(2), b=bit2(4).
	expect(compiled).toContain("t_changed_mask |= 1"); // id
	expect(compiled).toContain("t_changed_mask |= 2"); // a
	expect(compiled).toContain("t_changed_mask |= 4"); // b
});
