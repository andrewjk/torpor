import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";

test("watching a simple object", () => {
  const input = {
    name: "Andrew",
  };
  const output = $watch(input);
  // @ts-ignore $isProxy is hidden
  expect(output.$isProxy).toBe(true);
});
