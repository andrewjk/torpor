import { expect, test } from "vitest";
import buildStyles from "../../src/compile/build/client/buildStyles";
import parse from "../../src/compile/parse";
import { type ParseResult } from "../../src/compile/types/ParseResult";
import { att, el, root, text, trimParsed } from "../helpers";

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
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	/* @render */

	
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					markup: root([el("h1", [att("class", '"torp-1wvcb3a"')], [text("Hi")])]),
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
						hash: "1wvcb3a",
					},
				},
			],
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
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
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
						hash: "5fqf2e",
					},
				},
			],
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
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
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
						hash: "bv7ypa",
					},
				},
			],
		},
	};
	expect(output).toEqual(expected);
});

test("style with combinators", () => {
	const input = `
export default function Test() {
	@style {
		.h1.blah p > .child + .next {
			color: blue;
		}
	}
}
`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					style: {
						global: false,
						blocks: [
							{
								selector: ".h1.blah p > .child + .next",
								attributes: [
									{
										name: "color",
										value: "blue",
									},
								],
								children: [],
							},
						],
						hash: "1hfc9nc",
					},
				},
			],
		},
	};
	expect(output).toEqual(expected);

	const style = buildStyles(expected.template?.components[0].style!, "1hfc9nc");
	const expectedStyle = `
.h1.blah.torp-1hfc9nc p.torp-1hfc9nc > .child.torp-1hfc9nc + .next.torp-1hfc9nc {
	color: blue;
}
`.trimStart();
	expect(style).toEqual(expectedStyle);
});

test("global style with combinators", () => {
	const input = `
export default function Test() {
	@style {
		:global(.h1.blah p > .child + .next) {
			color: blue;
		}
	}
}
`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					style: {
						global: false,
						blocks: [
							{
								selector: ":global(.h1.blah p > .child + .next)",
								attributes: [
									{
										name: "color",
										value: "blue",
									},
								],
								children: [],
							},
						],
						hash: "wbexfk",
					},
				},
			],
		},
	};
	expect(output).toEqual(expected);

	const style = buildStyles(expected.template?.components[0].style!, "wbexfk");
	const expectedStyle = `
.h1.blah p > .child + .next {
	color: blue;
}
`.trimStart();
	expect(style).toEqual(expectedStyle);
});

test("some global styles", () => {
	const input = `
export default function Test() {
	@style {
		:global(.h1.blah) p > .child + :global(.next) {
			color: blue;
		}
	}
}
`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					style: {
						global: false,
						blocks: [
							{
								selector: ":global(.h1.blah) p > .child + :global(.next)",
								attributes: [
									{
										name: "color",
										value: "blue",
									},
								],
								children: [],
							},
						],
						hash: "1cfcedi",
					},
				},
			],
		},
	};
	expect(output).toEqual(expected);

	const style = buildStyles(expected.template?.components[0].style!, "1cfcedi");
	const expectedStyle = `
.h1.blah p.torp-1cfcedi > .child.torp-1cfcedi + .next {
	color: blue;
}
`.trimStart();
	expect(style).toEqual(expectedStyle);
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
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
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
						hash: "c2o17j",
					},
				},
			],
		},
	};
	expect(output).toEqual(expected);
});

test("style with comments", () => {
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
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
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
						hash: "z7n1b7",
					},
				},
			],
		},
	};
	expect(output).toEqual(expected);
});

test("style with quotes", () => {
	const input = `
export default function Test() {
	@style {
		p {
			color: "blue";
		}
	}
}
`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [],
			script: `
export default function Test(/* @params */) {
	/* @start */
	
	/* @end */
}
`,
			components: [
				{
					start: 25,
					name: "Test",
					default: true,
					style: {
						global: false,
						blocks: [
							{
								selector: "p",
								attributes: [
									{
										name: "color",
										value: '"blue"',
									},
								],
								children: [],
							},
						],
						hash: "7qpvk6",
					},
				},
			],
		},
	};
	expect(output).toEqual(expected);
});
