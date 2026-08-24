import { expect, test } from "vite-plus/test";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";

const source = `
export default function Parent() {
	@render {
		<List>
			<Header>
				@for (let item of $slot.items) {
					<span>{item.text}</span>
				}
			</Header>
		</List>
	}
}

function List() {
	@render {
		<div>
			<slot />
		</div>
	}
}

function Header() {
	@render {
		<div>
			<slot />
		</div>
	}
}
`;

// A fill that passes its content to a child component which reads $slot in
// its own fill must not declare $slot itself, or the generated code has an
// unused variable error at file level
test("nested fill slot props -- client", () => {
	const parsed = parse(source);
	expect(parsed.errors).toEqual([]);

	const result = build(parsed.template!);
	// The fill passed to <List> does not read $slot in its own scope
	expect(result.code).toContain("_$slot?: Record<PropertyKey, any>");
	// The fill passed to <Header> reads $slot
	expect(result.code).toContain("$slot: Record<PropertyKey, any>");
	expect(result.code).toContain("for (let item of $slot.items)");
});

test("nested fill slot props -- server", () => {
	const parsed = parse(source);
	expect(parsed.errors).toEqual([]);

	const result = build(parsed.template!, { server: true });
	expect(result.code).toContain("_$slot?: Record<PropertyKey, any>");
	expect(result.code).toContain("$slot: Record<PropertyKey, any>");
	expect(result.code).toContain("for (let item of $slot.items)");
});
