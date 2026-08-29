import { expect, test } from "vite-plus/test";
import parse from "../../src/compile/parse";
import { trimParsed } from "../helpers";

test("spread attribute on an element", () => {
	const input = `
export default function Test() {
	let $state = $watch({ name: "Jim" })

	@render {
		<div {...$state}>
			<p>Content</p>
		</div>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(false);
	expect(output.errors.length).toBe(1);
	expect(output.errors[0].message).toBe("Spread attributes are not supported");
});

test("spread attribute on a component", () => {
	const input = `
export default function Test() {
	let $state = $watch({ name: "Jim" })

	@render {
		<Child {...$state} />
	}
}

function Child() {
	@render {
		<p>
			{$props.name}
		</p>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(false);
	expect(output.errors.length).toBe(1);
	expect(output.errors[0].message).toBe("Spread attributes are not supported");
});

test("spread attribute as a value", () => {
	const input = `
export default function Test() {
	let $state = $watch({ disabled: true })

	@render {
		<button disabled={...$state}>Content</button>
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(false);
	expect(output.errors.length).toBe(1);
	expect(output.errors[0].message).toBe("Spread attributes are not supported");
});
