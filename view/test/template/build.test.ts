import { expect, test } from "vitest";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";

// TODO: Preserve space

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
  if (parseResult.ok && parseResult.syntaxTree) {
    const output = build("Template", parseResult.syntaxTree);
    const expected = `
import { renderElement as $el, renderText as $text } from "../../dist";

export default function Template($parent, $anchor) {
  // TODO: Script stuff here

  // TODO: Push this scope onto the stack, for tracking subscriptions

  let $el1 = $el($anchor, "h2", {}, [
    $text("Section heading")
  ]);
  let $el2 = $el($el1, "p", {}, [
    $text("Article content.")
  ])

  // TODO: Pop this scope off the stack

  // TODO: Return a destroy function that will get stored with the anchor and removes listeners etc
}
`;
    expect(output).toEqual(expected);
  }
});
