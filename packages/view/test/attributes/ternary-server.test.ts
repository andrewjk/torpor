import { expect, test } from "vite-plus/test";
import importComponent from "../importComponent";

// A ternary-valued dynamic attribute used to compile to
// `${on ? 0 : -1 ? `tabindex="..."` : ""}` -- parsed as `on ? 0 : (...)`, so
// the truthy branch emitted the raw value with no attribute name
// (`0 true active`). The value must be parenthesised before the guard.
const source = `
export default function TernaryServer($props: { on: boolean }) {
	@render {
		<button
			role="radio"
			tabindex={$props.on ? 0 : -1}
			aria-checked={$props.on ? "true" : "false"}
			data-state={$props.on ? "active" : "inactive"}
		>Hello</button>
	}
}
`;

test("server renders ternary-valued attributes with their names", async () => {
	const serverComponent = await importComponent(import.meta.filename, source, "server");

	const on = (await serverComponent({ on: true })).body;
	expect(on).toContain('aria-checked="true"');
	expect(on).toContain('data-state="active"');
	expect(on).not.toContain("0 true");

	const off = (await serverComponent({ on: false })).body;
	expect(off).toContain('aria-checked="false"');
	expect(off).toContain('data-state="inactive"');
	expect(off).toContain('tabindex="-1"');
});
