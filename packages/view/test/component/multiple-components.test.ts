import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import build from "../../src/compile/build";
import parseCode from "../../src/compile/parse/parseCode";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function MultiComponent($props: { label: string }) {
	let $state = $watch({ count: 1 });

	@render {
		<div>
			<p>outer {$state.count}</p>
			<Inner label={$props.label} />
		</div>
	}
}

interface InnerProps {
	label: string;
}

/**
 * The inner component, in the same file.
 */
function Inner($props: InnerProps) {
	@render {
		<span>inner {$props.label}</span>
	}
}
`;

// Regression test: an interface (or any top-level brace block) between two
// component functions used to emit a spurious component end marker, which
// desynced the build's component/chunk bookkeeping and crashed the client
// build with `Cannot read properties of undefined (reading 'markup')` in
// buildTemplate
test("multiple components in one file -- mounted", async () => {
	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	let $state = $watch({ label: "amy" });
	mountComponent(container, component, $state);

	expect(queryByText(container, "outer 1")).not.toBeNull();
	expect(queryByText(container, "inner amy")).not.toBeNull();

	$state.label = "bob";
	expect(queryByText(container, "inner bob")).not.toBeNull();
});

test("multiple components in one file -- hydrated", async () => {
	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	let $state = $watch({ label: "amy" });
	hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(queryByText(container, "outer 1")).not.toBeNull();
	expect(queryByText(container, "inner amy")).not.toBeNull();
});

test("a second default export is a compile error, not a build crash", () => {
	const parsed = parseCode(`
export default function A($props) {
	@render {
		<p>a</p>
	}
}

export default function B($props) {
	@render {
		<p>b</p>
	}
}
`);
	expect(parsed.ok).toBe(false);
	expect(parsed.errors.some((e) => e.message.includes("Multiple default exports"))).toBe(true);
});

test("an interface between components builds without a spurious component end", () => {
	const parsed = parseCode(`
export default function A($props) {
	@render {
		<p>a</p>
	}
}

interface BProps {
	complete: boolean;
}

function B($props: BProps) {
	@render {
		<span>b</span>
	}
}
`);
	expect(parsed.ok).toBe(true);
	expect(parsed.template!.components.map((c) => c.name)).toEqual(["A", "B"]);
	expect(() => build(parsed.template!)).not.toThrow();
	// The interface's closing brace must not emit an end marker — exactly
	// one end chunk per component
	const endCount = parsed.template!.script.filter((c) => c.script === "/* @end */").length;
	expect(endCount).toBe(2);
});
