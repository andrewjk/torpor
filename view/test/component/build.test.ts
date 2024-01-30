import { expect, test } from "vitest";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";
import { trimCode } from "../helpers";

test("import component", () => {
  const input = `
  <script>
  import Component from './Component.tera';
  </script>
  <Component />
`;

  const parseResult = parse(input);
  expect(parseResult.errors).toEqual([]);
  if (parseResult.ok && parseResult.syntaxTree) {
    const output = build("Template", parseResult.syntaxTree);
    const expected = `
import watchEffect from '../../watch/src/watchEffect';
import clearRange from '../../view/src/render/clearRange';
import reconcileList from '../../view/src/render/reconcileList';
import Component from './Component.tera';

const Template = {
name: "Template",
render: (parent, anchor, $props) => {
Component.render(parent, anchor && anchor.nextSibling);
}
};

export default Template;
`.trim();
    expect(trimCode(output)).toEqual(expected);
  }
});

test("import component with props", () => {
  const input = `
  <script>
  import Component from './Component.tera';
  </script>
  <Component prop="hi"/>
`;

  const parseResult = parse(input);
  expect(parseResult.errors).toEqual([]);
  if (parseResult.ok && parseResult.syntaxTree) {
    const output = build("Template", parseResult.syntaxTree);
    const expected = `
import watchEffect from '../../watch/src/watchEffect';
import clearRange from '../../view/src/render/clearRange';
import reconcileList from '../../view/src/render/reconcileList';
import Component from './Component.tera';

const Template = {
name: "Template",
render: (parent, anchor, $props) => {
Component.render(parent, anchor && anchor.nextSibling, { prop: "hi" });
}
};

export default Template;
`.trim();
    expect(trimCode(output)).toEqual(expected);
  }
});
