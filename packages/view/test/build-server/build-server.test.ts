import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import fs from "node:fs";
import path from "node:path";
import { transform } from "sucrase";
import { expect, test } from "vite-plus/test";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";

test("build for the server and render to HTML", async () => {
	// This is just a simple test -- server building gets tested thoroughly when
	// each test is run in hydration mode
	const state = { counter: 8 };

	const torpPath = path.join(__dirname, "components", "IfNested.torp");
	const source = fs.readFileSync(torpPath).toString();

	const parsed = parse(source);
	expect(parsed.errors).toEqual([]);
	expect(parsed.template).not.toBeUndefined();

	const rendered = build(parsed.template!, { server: true });
	let code = `
${rendered.code.replace("export default ", "").replace("import ", "//import ")}
IfNested;
`;
	// Strip TypeScript
	code = transform(code, { transforms: ["typescript"] }).code;

	// eslint-disable-next-line
	const html = (await eval(code)(state)).body;

	const container = document.createElement("div");
	container.innerHTML = html;
	document.body.appendChild(container);

	expect(queryByText(container, "It's both true!")).toBeNull();
	expect(queryByText(container, "The second is not true!")).not.toBeNull();
	expect(queryByText(container, "The first is not true!")).toBeNull();
});
