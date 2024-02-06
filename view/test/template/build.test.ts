import { expect, test } from "vitest";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";
import { trimCode } from "../helpers";

// TODO: Preserve space
/*
test("template", () => {
  const input = `
<section>
  <h2>Section heading</h2>
  <p>
    Article content.
  </p>
</section>
`;
  const parseResult = parse(input);
  expect(parseResult.errors).toEqual([]);
  if (parseResult.ok && parseResult.parts) {
    const output = build("Template", parseResult.parts).code;
    const expected = `
import watchEffect from '../../watch/src/watchEffect';
import clearRange from '../../view/src/render/clearRange';
import reconcileList from '../../view/src/render/reconcileList';

const Template = {
name: "Template",
render: (parent, anchor, $props) => {
const section1 = document.createElement("section");
const h21 = document.createElement("h2");
const text1 = document.createTextNode("Section heading");
h21.insertBefore(text1, null);
section1.insertBefore(h21, null);
const text2 = document.createTextNode(" ");
section1.insertBefore(text2, null);
const p1 = document.createElement("p");
const text3 = document.createTextNode("Article content.");
p1.insertBefore(text3, null);
section1.insertBefore(p1, null);
parent.insertBefore(section1, anchor && anchor.nextSibling);
}
};

export default Template;
`.trim();
    expect(trimCode(output)).toEqual(expected);
  }
});
*/
