import { expect, test } from "vite-plus/test";
import devAssert from "../../src/dev/devAssert";
import devContext from "../../src/dev/devContext";
import setDevMode from "../../src/dev/setDevMode";

test("devAssert does nothing when dev mode is off (production behavior)", () => {
	const prevEnabled = devContext.enabled;
	devContext.enabled = false;
	try {
		expect(() => devAssert(false, "should not throw")).not.toThrow();
		expect(() => devAssert(true, "should not throw")).not.toThrow();
	} finally {
		devContext.enabled = prevEnabled;
	}
});

test("devAssert throws the message when dev mode is on and the invariant fails", () => {
	const prevEnabled = devContext.enabled;
	setDevMode();
	try {
		expect(() => devAssert(true, "held")).not.toThrow();
		expect(() => devAssert(false, "invariant violated")).toThrowError("invariant violated");
	} finally {
		// Don't leak dev mode into other tests
		devContext.enabled = prevEnabled;
	}
});
