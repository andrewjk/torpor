import * as prettier from "prettier";
import { expect, test } from "vitest";

test("add spacing", async () => {
	const code = `
export default function Counter() {
let $state = $watch({
count: 0
})

@render {
<p>
The count is {$state.count}.
</p>
}

@style {
.btn {
border: 1px solid green;
}
}
}
	`;
	const expected = `
export default function Counter() {
	let $state = $watch({
		count: 0,
	});

	@render {
		<p>
			The count is {$state.count}.
		</p>
	}

	@style {
		.btn {
			border: 1px solid green;
		}
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("remove spacing", async () => {
	const code = `

	export default function Counter() {
		let $state = $watch({
	  		count: 0,
		});
	  
	  	@render {

			<p>

		  		The count is {$state.count}.

			</p>

		}
		
		@style {

			.btn {

	  			border: 1px solid green;

			}

		}

	}
`;
	const expected = `
export default function Counter() {
	let $state = $watch({
		count: 0,
	});

	@render {
		<p>
			The count is {$state.count}.
		</p>
	}

	@style {
		.btn {
			border: 1px solid green;
		}
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("nested tags", async () => {
	const code = `
export default function Counter() {
	@render {
		<p><span>hi</span></p>
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		<p><span>hi</span></p>
	}
}
`;
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("inline tags", async () => {
	const code = `
export default function Counter() {
	@render {
		<p>hi <Child /> there, you  <b>horrible</b>! person</p>
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		<p>hi <Child /> there, you <b>horrible</b>! person</p>
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("gap between tags", async () => {
	const code = `
export default function Counter() {
	@render {
		<p>para 1</p>



		<p>para 2</p>
		}
}
`;
	const expected = `
export default function Counter() {
	@render {
		<p>para 1</p>

		<p>para 2</p>
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("long line", async () => {
	const code = `
export default function Counter() {
	@render {
		<p class="lots of classes and some more" style="background-color: green; color: goldenrod; border: 1px solid silver;">
			Hi!
		</p>
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		<p
			class="lots of classes and some more"
			style="background-color: green; color: goldenrod; border: 1px solid silver;"
		>
			Hi!
		</p>
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("various attributes", async () => {
	const code = `
export default function Counter() {
	@render {
		<p class={["big", "large"]} style={{ color: "green" }} id={$props.id} {href} blah>
			Hi!
		</p>
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		<p class={["big", "large"]} style={{ color: "green" }} {$props.id} {href} blah>
			Hi!
		</p>
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("component", async () => {
	const code = `
export default function Counter() {
	@render {
		<Child name="Gary" />
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		<Child name="Gary" />
	}
}
`;
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("component with children", async () => {
	const code = `
export default function Counter() {
	@render {
		<Child name="Gary">
			Hi Gary
		</Child>
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		<Child name="Gary">
			Hi Gary
		</Child>
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("if statement", async () => {
	const code = `
export default function Counter() {
	@render {
			@if (true) {
				<p>hi</p>
			}
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		@if (true) {
			<p>hi</p>
		}
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("if/else statement", async () => {
	const code = `
export default function Counter() {
	@render {
			@if (true) {
				<p>hi</p>
			} else {
				<p>not sure...</p>
			}
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		@if (true) {
			<p>hi</p>
		} else {
			<p>not sure...</p>
		}
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("if/else if/else statement", async () => {
	const code = `
export default function Counter() {
	@render {
			@if (true) {
				<p>hi</p>
			} else if (false) {
				<p>nope</p>
			} else {
				<p>not sure...</p>
			}
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		@if (true) {
			<p>hi</p>
		} else if (false) {
			<p>nope</p>
		} else {
			<p>not sure...</p>
		}
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("switch statement", async () => {
	const code = `
export default function Counter() {
	@render {
			@switch {
				case 1: {
					<p>hi</p>
}
			}
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		@switch {
			case 1: {
				<p>hi</p>
			}
		}
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("switch/default statement", async () => {
	const code = `
export default function Counter() {
	@render {
			@switch {
				case 1: {
					<p>hi</p>
}
					default: {
						<p>hmm</p>
				}
			}
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		@switch {
			case 1: {
				<p>hi</p>
			}
			default: {
				<p>hmm</p>
			}
		}
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("for statement", async () => {
	const code = `
export default function Counter() {
	@render {
			@for (let i=0; i < 5; i++ ) {
					@key id
					<p>{i}</p>
			}
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		@for (let i=0; i < 5; i++ ) {
			@key id
			<p>{i}</p>
		}
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("multi-line text", async () => {
	const code = `
export default function Counter() {
	@render {
			<p>
				This should
			get the right
					spacing.
			</p>
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		<p>
			This should
			get the right
			spacing.
		</p>
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("leave pre and code", async () => {
	const code = `
export default function Counter() {
	@render {
			<pre>
				This should
			get the right
					spacing.
			</pre>
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		<pre>
				This should
			get the right
					spacing.
			</pre>
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("style gaps", async () => {
	const code = `
export default function Counter() {
	@style {
	button {

		color: green;

		background-color: pink;

	}
		p {
			color: red;
		}

		input {
				color: yellow;
		}
	}
}
`;
	const expected = `
export default function Counter() {
	@style {
		button {
			color: green;

			background-color: pink;
		}
		p {
			color: red;
		}

		input {
			color: yellow;
		}
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("style comments", async () => {
	const code = `
export default function Counter() {
	@style {
			// This is a button style
		button {
			color: green;
		}

		
		/* This is another comment */
	}
}
`;
	const expected = `
export default function Counter() {
	@style {
		// This is a button style
		button {
			color: green;
		}

		/* This is another comment */
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("head section", async () => {
	const code = `
export default function Counter() {
	@head {
			@for (let i=0; i < 5; i++ ) {
					@key id
					<p>{i}</p>
			}
	}
}
`;
	const expected = `
export default function Counter() {
	@head {
		@for (let i=0; i < 5; i++ ) {
			@key id
			<p>{i}</p>
		}
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("head section followed by render", async () => {
	const code = `
export default function Counter() {
	@head {
			@for (let i=0; i < 5; i++ ) {
					@key id
					<p>{i}</p>
			}
	}

	@render {
		<p>hi</p>
	}
}
`;
	const expected = `
export default function Counter() {
	@head {
		@for (let i=0; i < 5; i++ ) {
			@key id
			<p>{i}</p>
		}
	}

	@render {
		<p>hi</p>
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

test("comments", async () => {
	const code = `
export default function Counter() {
	@render {
		@// a comment...
		<p>hi</p>
		@/* another comment... */
	}
}
`;
	const expected = `
export default function Counter() {
	@render {
		@// a comment...
		<p>hi</p>
		@/* another comment... */
	}
}
`.trimStart();
	const result = await prettierFormat(code);
	expect(result).toBe(expected);
});

async function prettierFormat(code: string) {
	return await prettier.format(code, {
		parser: "torpor-parser",
		plugins: ["./src/index.ts"],
		printWidth: 100,
		useTabs: true,
	});
}
