import { assert, expect, test } from "vitest";
import buildStyles from "../../src/compile/build/client/buildStyles";
import parse from "../../src/compile/parse";
import { att, el, root, text, trimParsed } from "../helpers";
import type BlockNode from "../../src/compile/types/styles/BlockNode";
import type StyleNode from "../../src/compile/types/styles/StyleNode";
import type AttributeNode from "../../src/compile/types/styles/AttributeNode";
import type CommentNode from "../../src/compile/types/styles/CommentNode";

function block(selector: string, children: StyleNode[]) {
	return {
		type: "block" as const,
		selector,
		children,
		gapBefore: false
	} satisfies BlockNode
}

function attr(name: string, value: string) {
	return {
		type: "attribute",
		name,
		value,
		gapBefore: false
	} satisfies AttributeNode
}

function comment(content: string) {
	return {
		type: "comment",
		content,
		gapBefore: false
	} satisfies CommentNode
}

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
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) /* @return_type */ {/* @start */
	/* @render */

	/* @style */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].markup).toEqual(
		root([el("h1", [att("class", '"torp-1wvcb3a"')], [text("Hi")])]),
	);
	expect(output.template.components[0].style).toEqual({
		global: false,
		children: [
			block("h1", [ attr("color", "blue")]),
		],
		hash: "1wvcb3a",
	});
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
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) /* @return_type */ {/* @start */
	/* @style */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].style).toEqual({
		global: false,
		children: [
			block(".h1, p", [ attr("color", "blue") ])
		],
		hash: "5fqf2e",
	});
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
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) /* @return_type */ {/* @start */
	/* @style */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].style).toEqual({
		global: false,
		children: [
			block(".h1, p", [ attr("color", "blue"), attr("background-color", "green") ])
		],
		hash: "bv7ypa",
	});
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
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) /* @return_type */ {/* @start */
	/* @style */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);

	const styleObject = {
		global: false,
		children: [
			block(".h1.blah p > .child + .next", [ attr("color", "blue")]),
		],
		hash: "1hfc9nc",
	};
	expect(output.template.components[0].style).toEqual(styleObject);

	const style = buildStyles(styleObject, "1hfc9nc");
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
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) /* @return_type */ {/* @start */
	/* @style */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);

	const styleObject = {
		global: false,
		children: [
			block(":global(.h1.blah p > .child + .next)", [ attr("color", "blue")]),
		],
		hash: "wbexfk",
	};
	expect(output.template.components[0].style).toEqual(styleObject);

	const style = buildStyles(styleObject, "wbexfk");
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
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) /* @return_type */ {/* @start */
	/* @style */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);

	const styleObject = {
		global: false,
		children: [
			block(":global(.h1.blah) p > .child + :global(.next)", [ attr("color", "blue")]),
		],
		hash: "1cfcedi",
	};
	expect(output.template.components[0].style).toEqual(styleObject);

	const style = buildStyles(styleObject, "1cfcedi");
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
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) /* @return_type */ {/* @start */
	/* @style */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].style).toEqual({
		global: false,
		children: [
			block("@media screen and (min-width: 480px)", [ block("button", [attr("color", "green")])]),
		],
		hash: "c2o17j",
	});
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
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) /* @return_type */ {/* @start */
	/* @style */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].style).toEqual({
		global: false,
		children: [
			comment(`/*
		p {
			color: blue
		}
		*/`),
			block("button", [attr("color", "green")]),
			comment("//span: {"),
			comment("//	color: purple;"),
			comment("//}")
		],
		hash: "qktc5q",
	});
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
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) /* @return_type */ {/* @start */
	/* @style */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);
	expect(output.template.components[0].style).toEqual({
		global: false,
		children: [
			block("p", [ attr("color", '"blue"')]),
		],
		hash: "7qpvk6",
	});
});

test("style with pseudo-elements", () => {
	const input = `
export default function Test() {
	@style {
		p::before {
			content: "~";
		}
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) /* @return_type */ {/* @start */
	/* @style */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);

	const styleObject = {
		global: false,
		children: [
			block("p::before", [ attr("content", '"~"')]),
		],
		hash: "5cr73h",
	};
	expect(output.template.components[0].style).toEqual(styleObject);

	const style = buildStyles(styleObject, "5cr73h");
	const expectedStyle = `
p.torp-5cr73h::before {
	content: "~";
}
`.trimStart();
	expect(style).toEqual(expectedStyle);
});

test("style with selectors", () => {
	const input = `
export default function Test() {
	@style {
		p:hover {
			color: "blue";
		}
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) /* @return_type */ {/* @start */
	/* @style */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);

	const styleObject = {
		global: false,
		children: [
			block("p:hover", [ attr("color", '"blue"')]),
		],
		hash: "1pq0u26",
	};
	expect(output.template.components[0].style).toEqual(styleObject);

	const style = buildStyles(styleObject, "1pq0u26");
	const expectedStyle = `
p.torp-1pq0u26:hover {
	color: "blue";
}
`.trimStart();
	expect(style).toEqual(expectedStyle);
});

test("style with multiple selectors", () => {
	const input = `
export default function Test() {
	@style {
		p:hover,
		p:active,
		p:focused {
			color: "blue";
		}
	}
}
`;
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe(`
export default function Test(/* @params */) /* @return_type */ {/* @start */
	/* @style */
/* @end */}
`);
	expect(output.template.components.length).toBe(1);
	expect(output.template.components[0].start).toBe(25);
	expect(output.template.components[0].name).toBe("Test");
	expect(output.template.components[0].default).toBe(true);

	let styleObject = {
		global: false,
		children: [
			block("p:hover,\n\t\tp:active,\n\t\tp:focused", [ attr("color", '"blue"')]),
		],
		hash: "1ib1oex",
	};

	expect(output.template.components[0].style).toEqual(styleObject);

	const style = buildStyles(styleObject, "1ib1oex");
	const expectedStyle = `
p.torp-1ib1oex:hover, p.torp-1ib1oex:active, p.torp-1ib1oex:focused {
	color: "blue";
}
`.trimStart();
	expect(style).toEqual(expectedStyle);
});
