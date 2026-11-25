import { describe, expect, test } from "vite-plus/test";
import formDataToRecord from "../src/form/formDataToRecord";
import searchParamsToRecord from "../src/utils/searchParamsToRecord";

describe("formDataToRecord", () => {
	test("keeps fields named like Object.prototype members", async () => {
		const formData = new FormData();
		formData.append("name", "Andrew");
		formData.append("constructor", "c");
		formData.append("toString", "t");
		formData.append("valueOf", "v");
		formData.append("__proto__", "p");

		const record = await formDataToRecord(formData);
		// Spread preserves the keys (including `__proto__`, which the object
		// literal needs as a computed key so it isn't taken as the prototype)
		expect({ ...record }).toEqual({
			name: "Andrew",
			constructor: "c",
			toString: "t",
			valueOf: "v",
			["__proto__"]: "p",
		});
		// No prototype pollution: the record's prototype is still absent
		expect(Object.getPrototypeOf(record)).toBeNull();
	});

	test("collects repeated fields into an array", async () => {
		const formData = new FormData();
		formData.append("tag", "a");
		formData.append("tag", "b");

		const record = await formDataToRecord(formData);
		expect(record.tag).toEqual(["a", "b"]);
	});
});

describe("searchParamsToRecord", () => {
	test("keeps params named like Object.prototype members", () => {
		const params = new URLSearchParams(
			"name=Andrew&constructor=c&toString=t&valueOf=v&__proto__=p",
		);

		const record = searchParamsToRecord(params);
		expect({ ...record }).toEqual({
			name: "Andrew",
			constructor: "c",
			toString: "t",
			valueOf: "v",
			["__proto__"]: "p",
		});
		expect(Object.getPrototypeOf(record)).toBeNull();
	});

	test("collects repeated params into an array", () => {
		const record = searchParamsToRecord(new URLSearchParams("tag=a&tag=b"));
		expect(record.tag).toEqual(["a", "b"]);
	});
});
