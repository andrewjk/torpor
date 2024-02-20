import { expect, test } from "vitest";
import watch from "../../src/watch/watch";
import watchEffect from "../../src/watch/watchEffect";

test("watching a function effect", () => {
  const person = watch({
    firstName: "Andrew",
    lastName: "Smith",
    fullName: function () {
      return `${this.firstName} ${this.lastName}`;
    },
  });
  let greeting = "";
  const effect = watchEffect(() => {
    greeting = `Hi, ${person.fullName()}!`;
  });
  expect(greeting).toBe("Hi, Andrew Smith!");
  person.firstName = "John";
  expect(greeting).toBe("Hi, John Smith!");
});
