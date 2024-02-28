import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";

test("watching a nested object", () => {
  const input = {
    person: {
      name: "Andrew",
    },
  };
  const output = $watch(input);
  // @ts-ignore $isProxy is hidden
  expect(output.$isProxy).toBe(true);
  // @ts-ignore $isProxy is hidden
  expect(output.person.$isProxy).toBe(true);
});
