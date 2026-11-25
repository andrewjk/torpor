import { expect, test } from "vite-plus/test";
import collectImportNames from "../../src/compile/parse/collectImportNames";
import parse from "../../src/compile/parse";
import type TemplateNode from "../../src/compile/types/nodes/TemplateNode";
import isComponentNode from "../../src/compile/utils/isComponentNode";
import isElementNode from "../../src/compile/utils/isElementNode";
import isParentNode from "../../src/compile/utils/isParentNode";

function tags(source: string): Record<string, string> {
	const parsed = parse(source);
	expect(parsed.errors).toEqual([]);
	const result: Record<string, string> = {};
	for (const component of parsed.template!.components) {
		walk(component.markup);
		if (component.error) walk(component.error);
		if (component.head) walk(component.head);
	}
	return result;

	function walk(node: TemplateNode | undefined) {
		if (!node) return;
		if (isElementNode(node) || isComponentNode(node)) {
			result[node.tagName] = node.type;
		}
		if (isParentNode(node)) {
			for (const child of node.children) walk(child);
		}
	}
}

test("imported tags are components", () => {
	const types = tags(`
import Card from "./Card.torp";
import { Icon as Badge } from "./Icons.torp";

export default function Test() {
	@render {
		<Card />
		<Badge />
	}
}
`);

	expect(types.Card).toBe("component");
	expect(types.Badge).toBe("component");
});

test("lowercase imported tags are components", () => {
	const types = tags(`
import card from "./Card.torp";

export default function Test() {
	@render {
		<card />
	}
}
`);

	expect(types.card).toBe("component");
});

test("components declared later in the same file are components", () => {
	const types = tags(`
export default function Test() {
	@render {
		<Inner />
	}
}

function Inner() {
	@render {
		<span>inner</span>
	}
}
`);

	expect(types.Inner).toBe("component");
	expect(types.span).toBe("element");
});

test("native tags stay elements even when capitalized imports exist", () => {
	const types = tags(`
import Text from "./Text.torp";

export default function Test() {
	@render {
		<svg>
			<linearGradient />
			<text>label</text>
		</svg>
		<Text>imported</Text>
	}
}
`);

	expect(types.svg).toBe("element");
	expect(types.linearGradient).toBe("element");
	expect(types.text).toBe("element");
	expect(types.Text).toBe("component");
});

test("custom elements with dashes stay elements", () => {
	const types = tags(`
export default function Test() {
	@render {
		<my-widget foo="bar">content</my-widget>
	}
}
`);

	expect(types["my-widget"]).toBe("element");
});

test("unknown capitalized tags are errors", () => {
	const parsed = parse(`
export default function Test() {
	@render {
		<Widget />
	}
}
`);

	expect(parsed.ok).toBe(false);
	expect(parsed.errors[0]!.message).toContain("Unknown component or element: Widget");
});

test("type-only imports don't make a tag a component", () => {
	const parsed = parse(`
import type Widget from "./Widget.torp";

export default function Test() {
	@render {
		<Widget />
	}
}
`);

	expect(parsed.ok).toBe(false);
	expect(parsed.errors[0]!.message).toContain("Unknown component or element: Widget");
});

test("allowUnknownComponents treats external capitalized tags as components", () => {
	const parsed = parse(
		`
export default function Test() {
	@render {
		<Widget />
	}
}
`,
		{ allowUnknownComponents: true },
	);

	expect(parsed.errors).toEqual([]);
	const widget = parsed.template!.components[0]!.markup!.children.find(
		(node) => node.type === "component",
	);
	expect(widget).toBeDefined();
});

test("collects default, named, aliased and namespace imports", () => {
	const names = collectImportNames(`
import Default from "./Default.torp";
import DefaultTwo, { Named, Other as Aliased } from "./Mixed.torp";
import * as Namespace from "./Namespace.torp";
import "./side-effect";
import {
	Multiline,
	type OnlyAType,
} from "./Multiline.torp";
`);

	expect([...names].sort()).toEqual(
		["Aliased", "Default", "DefaultTwo", "Multiline", "Named", "Namespace"].sort(),
	);
});

test("ignores imports mentioned in strings, comments and expressions", () => {
	const names = collectImportNames(`
const text = "import Fake from './Fake.torp'";
// import Commented from "./Commented.torp"
/* import Block from "./Block.torp" */
const dynamic = import("./Dynamic.torp");
const object = { import: "not a keyword" };
`);

	expect([...names]).toEqual([]);
});
