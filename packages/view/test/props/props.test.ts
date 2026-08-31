import { expect, test } from "vite-plus/test";
import parse from "../../src/compile/parse";

test("props", () => {
	const input = `
export default function Test() {
	@render {
		<p>
			Hi {$props.name}. You are {$props["age"]} years old and live at {$props['address']}.
		</p>
	}
}
`;
	const output = parse(input);
	const expected = ["name", "age", "address"];
	expect(output.template?.components[0].props).toEqual(expected);
});

test("props -- bare $props reference", () => {
	const input = `
export default function Test() {
	let props = $props ?? {};

	@render {
		<p>
			Hi {props.name}!
		</p>
	}
}
`;
	const output = parse(input);
	expect(output.template?.components[0].props).toEqual(["$props"]);
});

test("props -- $props in markup expression is detected", () => {
	const input = `
export default function Test() {
	@render {
		<p>
			<a href={$props.url}>Hi {$props.name}!</a>
		</p>
	}
}
`;
	const output = parse(input);
	expect(output.template?.components[0].props).toEqual(["url", "name"]);
});

test("props -- $props in a sample string is ignored", () => {
	const input = `
export default function Test() {
	const sample = \`
		function Component($props: { name: string }) {
			@render {
				<p>Hi {$props.name}!</p>
			}
		}
	\`;

	@render {
		<p>Hello!</p>
	}
}
`;
	const output = parse(input);
	expect(output.template?.components[0].props).toBeUndefined();
});

test("props -- $props bracket access in a sample string is ignored", () => {
	const input = `
export default function Test() {
	const sample = \`
		function Component($props: Props) {
			@render {
				<p>Hi {$props["name"]}!</p>
			}
		}
	\`;

	@render {
		<p>Hello!</p>
	}
}
`;
	const output = parse(input);
	expect(output.template?.components[0].props).toBeUndefined();
});

test("props -- $props in a comment is ignored", () => {
	const input = `
export default function Test() {
	/* The $props.name value is shown below */
	@render {
		<p>Hello!</p>
	}
}
`;
	const output = parse(input);
	expect(output.template?.components[0].props).toBeUndefined();
});

test("props -- $props in markup prose is ignored", () => {
	const input = `
export default function Test() {
	@render {
		<p>
			The <code>$props.name</code> value.
		</p>
	}
}
`;
	const output = parse(input);
	expect(output.template?.components[0].props).toBeUndefined();
});

test("props -- $props in a @head block is detected", () => {
	const input = `
export default function Test() {
	@head {
		<title>{$props.title}</title>
	}

	@render {
		<p>Hello!</p>
	}
}
`;
	const output = parse(input);
	expect(output.template?.components[0].props).toEqual(["title"]);
});

test("props -- second component's usage doesn't leak into the first", () => {
	const input = `
export default function First() {
	@render {
		<p>Hello!</p>
	}
}

function Second() {
	@render {
		<p>
			Hi {$props.name}!
		</p>
	}
}
`;
	const output = parse(input);
	expect(output.template?.components[0].props).toBeUndefined();
	expect(output.template?.components[1].props).toEqual(["name"]);
});
