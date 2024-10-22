import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
import { el, root, text, trimParsed } from "../helpers";

test("simple style", () => {
	const input = `
export default function Test() {
	@render {
		<h1>Hi</h1>
	}

	@style {
		h1 { color: blue; }
	}
}
`;
	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */

	
}
`,
			markup: root([el("h1", [{ name: "class", value: '"tera-1wvcb3a"' }], [text("Hi")])]),
			style: {
				global: false,
				blocks: [
					{
						selector: "h1",
						attributes: [
							{
								name: "color",
								value: "blue",
							},
						],
						children: [],
					},
				],
			},
		},
	};
	expect(output).toEqual(expected);
});

test("style with multiple selectors", () => {
	const input = `
export default function Test() {
	@style {
		.h1, p { color: blue; }
	}
}
`;
	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			script: `
export default function Test(/* @params */) {
	/* @start */
	
}
`,
			style: {
				global: false,
				blocks: [
					{
						selector: ".h1, p",
						attributes: [
							{
								name: "color",
								value: "blue",
							},
						],
						children: [],
					},
				],
			},
		},
	};
	expect(output).toEqual(expected);
});

test("style with multiple values", () => {
	const input = `
export default function Test() {
	@style {
		.h1, p {
			color: blue;
			background-color: green;
		}
	}
}
`;
	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			script: `
export default function Test(/* @params */) {
	/* @start */
	
}
`,
			style: {
				global: false,
				blocks: [
					{
						selector: ".h1, p",
						attributes: [
							{
								name: "color",
								value: "blue",
							},
							{
								name: "background-color",
								value: "green",
							},
						],
						children: [],
					},
				],
			},
		},
	};
	expect(output).toEqual(expected);
});

test("media query", () => {
	const input = `
export default function Test() {
	@style {
		@media screen and (min-width: 480px) {
			button {
				color: green;
			}
		}
	}
}
`;
	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			script: `
export default function Test(/* @params */) {
	/* @start */
	
}
`,
			style: {
				global: false,
				blocks: [
					{
						selector: "@media screen and (min-width: 480px)",
						attributes: [],
						children: [
							{
								selector: "button",
								attributes: [
									{
										name: "color",
										value: "green",
									},
								],
								children: [],
							},
						],
					},
				],
			},
		},
	};
	expect(output).toEqual(expected);
});

test("comments in style", () => {
	const input = `
export default function Test() {
	@style {
		/*
		p {
			color: blue
		}
		*/
		button {
			color: green;
		}
		//span: {
		//	color: purple;
		//}
	}
}
`;
	const output = trimParsed(parse("x", input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			script: `
export default function Test(/* @params */) {
	/* @start */
	
}
`,
			style: {
				global: false,
				blocks: [
					{
						selector: "button",
						attributes: [
							{
								name: "color",
								value: "green",
							},
						],
						children: [],
					},
				],
			},
		},
	};
	expect(output).toEqual(expected);
});
