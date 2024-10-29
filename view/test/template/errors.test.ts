import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import { trimParsed } from "../helpers";

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
			},
		],
	};
	expect(output).toEqual(expected);
});

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
				start: 47,
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
				start: 56,
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
				start: 54,
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
				start: 63,
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
			{
				message: "Multiple top-level elements: span",
				start: 58,
			},
			{
				message: "Non matching close tag: input",
				start: 76,
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
				message: "Non matching close tag: input (expected div)",
				start: 87,
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
				message: "Non matching close tag: li (expected p)",
				start: 80,
			},
			{
				message: "Unclosed non-void element: p",
				start: 56,
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
				start: 64,
			},
			{
				message: "Non matching close tag: span (expected p)",
				start: 106,
			},
		],
	};
	expect(output).toEqual(expected);
});
