import { expect, test } from "vite-plus/test";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";

function buildErrors(source: string) {
	const parsed = parse(source);
	expect(parsed.ok).toBe(true);
	const result = build(parsed.template!, { source });
	return result.errors.map((e) => e.message);
}

// A `@for` loop variable is a *copy* of each element, so writing the binding
// (`&value={label}` → `label = …`) cannot update the source array. It is a
// compile error, matching `let x = arr[0]; x = …`.
test("writing a loop variable directly is an error", () => {
	const errors = buildErrors(`
export default function Test($props: { labels: string[] }) {
	@render {
		<ul>
			@for (let label of $props.labels) {
				<li><input &value={label} /></li>
			}
		</ul>
	}
}
`);
	expect(errors).toHaveLength(1);
	expect(errors[0]).toContain('Cannot assign to loop variable "label"');
});

test("C-style loop counter written directly is an error", () => {
	const errors = buildErrors(`
export default function Test($props: { labels: string[] }) {
	@render {
		<ul>
			@for (let i = 0; i < $props.labels.length; i++) {
				<li><input &value={i} /></li>
			}
		</ul>
	}
}
`);
	expect(errors).toHaveLength(1);
	expect(errors[0]).toContain('Cannot assign to loop variable "i"');
});

// The escape hatch: binding the *source* indexer is fine — the write target is
// `$props.labels[i]`, and `i` is only read. This is equivalent to
// `$props.labels[i] = …`, which does update the source.
test("binding the source indexer is not an error", () => {
	const errors = buildErrors(`
export default function Test($props: { labels: string[] }) {
	@render {
		<ul>
			@for (let i = 0; i < $props.labels.length; i++) {
				<li><input &value={$props.labels[i]} /></li>
			}
		</ul>
	}
}
`);
	expect(errors).toEqual([]);
});

// Property writes mutate the row object through the shadowed reference, so
// they remain valid and need no substitution.
test("property writes are not an error", () => {
	const errors = buildErrors(`
export default function Test($props: { rows: { name: string; done: boolean }[] }) {
	@render {
		<ul>
			@for (let row of $props.rows) {
				<li><input type="checkbox" &checked={row.done} />{row.name}</li>
			}
		</ul>
	}
}
`);
	expect(errors).toEqual([]);
});

// The forms below all compiled to a *silent phantom write* before this rule:
// `&value={x}` was textually substituted to `item.data.x = …`, so the DOM
// updated but the source never did. None of them has a generic
// `source[i] = …` fix (Map needs `.set`, `entries()` destructures an index
// that isn't the source, `{ name }` isn't addressable), which is why the
// diagnostic's hint is container-agnostic.

test("writing a Map value from destructured iteration is an error", () => {
	const errors = buildErrors(`
export default function Test($props: { m: Map<string, number> }) {
	@render {
		<ul>
			@for (let [key, val] of $props.m) {
				<li><input &value={val} /></li>
			}
		</ul>
	}
}
`);
	expect(errors).toHaveLength(1);
	expect(errors[0]).toContain('Cannot assign to loop variable "val"');
});

test("writing a value from entries() destructuring is an error", () => {
	const errors = buildErrors(`
export default function Test($props: { arr: string[] }) {
	@render {
		<ul>
			@for (let [i, v] of $props.arr.entries()) {
				<li><input &value={v} /></li>
			}
		</ul>
	}
}
`);
	expect(errors).toHaveLength(1);
	expect(errors[0]).toContain('Cannot assign to loop variable "v"');
});

test("writing an object-destructured loop var is an error", () => {
	const errors = buildErrors(`
export default function Test($props: { rows: { name: string }[] }) {
	@render {
		<ul>
			@for (let { name } of $props.rows) {
				<li><input &value={name} /></li>
			}
		</ul>
	}
}
`);
	expect(errors).toHaveLength(1);
	expect(errors[0]).toContain('Cannot assign to loop variable "name"');
});

// The hint must not imply a specific `source[i] = …` fix, since it can't be
// correct for every iterable form.
test("error hint does not prescribe a source-indexer fix", () => {
	const errors = buildErrors(`
export default function Test($props: { labels: string[] }) {
	@render {
		<ul>
			@for (let label of $props.labels) {
				<li><input &value={label} /></li>
			}
		</ul>
	}
}
`);
	expect(errors[0]).not.toContain("$props.items[i]");
	expect(errors[0]).toContain("mutate the source collection");
});
