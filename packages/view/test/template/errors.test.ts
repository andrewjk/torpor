import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import { trimParsed } from "../helpers";

/*
test("multiple top-level elements", () => {
	const input = `
export default function Test() {
	@render {
		<div/>
		<div/>
	}
}
  `;
	const output = trimParsed(parse(input));
	const expected = {
		ok: false,
		errors: [
			{
				message: "Multiple top-level elements: div",
				start: 56,
				line: 5,
				column: 2,
			},
		],
	};
	expect(output).toEqual(expected);
});
*/

test("unclosed non-void element", () => {
	const input = `
export default function Test() {
	@render {
		<p>I must be closed!
	}
}
  `;
	const output = trimParsed(parse(input));
	const expected = {
		ok: false,
		errors: [
			{
				message: "Unclosed non-void element: p",
				startIndex: 47,
				startLine: 3,
				startChar: 2,
				endIndex: 49,
				endLine: 3,
				endChar: 4,
			},
		],
	};
	expect(output).toEqual(expected);
});

test("unclosed non-void child element", () => {
	const input = `
export default function Test() {
	@render {
		<div>
			<p>I must be closed!
			<p>I am closed</p>
		</div>
	}
}
  `;
	const output = trimParsed(parse(input));
	const expected = {
		ok: false,
		errors: [
			{
				message: "Unclosed non-void element: p",
				startIndex: 56,
				startLine: 4,
				startChar: 3,
				endIndex: 58,
				endLine: 4,
				endChar: 5,
			},
		],
	};
	expect(output).toEqual(expected);
});

//test("self-closed non-void child element", () => {
//	const input = `
//export default function Test() {
//	@render {
//		<div>
//			<p />I must be closed!
//			<p>I am closed</p>
//		</div>
//	}
//}
//  `;
//	const output = trimParsed(parse(input));
//	const expected = {
//		ok: false,
//		errors: [
//			{
//				message: "Self-closed non-void element: p",
//				start: 300,
//			},
//		],
//	};
//	expect(output).toEqual(expected);
//});

test("closed void element", () => {
	const input = `
export default function Test() {
	@render {
		<input></input>
	}
}
  `;
	const output = trimParsed(parse(input));
	const expected = {
		ok: false,
		errors: [
			{
				message: "Closed void element: input",
				startIndex: 54,
				startLine: 3,
				startChar: 9,
				endIndex: 60,
				endLine: 3,
				endChar: 15,
			},
		],
	};
	expect(output).toEqual(expected);
});

test("closed void child element", () => {
	const input = `
export default function Test() {
	@render {
		<div>
			<input></input>
		</div>
	}
}
  `;
	const output = trimParsed(parse(input));
	const expected = {
		ok: false,
		errors: [
			{
				message: "Closed void element: input",
				startIndex: 63,
				startLine: 4,
				startChar: 10,
				endIndex: 69,
				endLine: 4,
				endChar: 16,
			},
		],
	};
	expect(output).toEqual(expected);
});

test("void element with children", () => {
	const input = `
export default function Test() {
	@render {
		<input>
			<span>Hi</span>
		</input>
	}
}
  `;
	const output = trimParsed(parse(input));
	const expected = {
		ok: false,
		errors: [
			//{
			//	message: "Multiple top-level elements: span",
			//	start: 58,
			//	line: 5,
			//	column: 3,
			//},
			{
				message: "Non-matching close tag: input",
				startIndex: 76,
				startLine: 5,
				startChar: 2,
				endIndex: 82,
				endLine: 5,
				endChar: 8,
			},
		],
	};
	expect(output).toEqual(expected);
});

test("child void element with children", () => {
	const input = `
export default function Test() {
	@render {
		<div>
			<input>
				<span>Hi</span>
			</input>
		</div>
	}
}
  `;

	const output = trimParsed(parse(input));
	const expected = {
		ok: false,
		errors: [
			{
				message: "Non-matching close tag: input (expected div)",
				startIndex: 87,
				startLine: 6,
				startChar: 3,
				endIndex: 91,
				endLine: 6,
				endChar: 7,
			},
		],
	};
	expect(output).toEqual(expected);
});

test("non-matching close tag", () => {
	const input = `
export default function Test() {
	@render {
		<div>
			<p>What's happening here</li>
		</div>
	}
}
  `;
	const output = trimParsed(parse(input));
	const expected = {
		ok: false,
		errors: [
			{
				message: "Unclosed non-void element: p",
				startIndex: 56,
				startLine: 4,
				startChar: 3,
				endIndex: 58,
				endLine: 4,
				endChar: 5,
			},
			{
				message: "Non-matching close tag: li (expected p)",
				startIndex: 80,
				startLine: 4,
				startChar: 27,
				endIndex: 82,
				endLine: 4,
				endChar: 29,
			},
		],
	};
	expect(output).toEqual(expected);
});

test("tag soup", () => {
	const input = `
export default function Test() {
	@render {
		<div>
			<p>
				<span>What's happening
			</p>
			here
			</span>
		</div>
	}
}
  `;
	const output = trimParsed(parse(input));
	const expected = {
		ok: false,
		errors: [
			{
				message: "Unclosed non-void element: span",
				startIndex: 64,
				startLine: 5,
				startChar: 4,
				endIndex: 69,
				endLine: 5,
				endChar: 9,
			},
			{
				message: "Non-matching close tag: span (expected p)",
				startIndex: 106,
				startLine: 8,
				startChar: 3,
				endIndex: 108,
				endLine: 8,
				endChar: 5,
			},
		],
	};
	expect(output).toEqual(expected);
});
