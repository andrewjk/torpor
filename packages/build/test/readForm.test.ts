import { describe, expect, test } from "vite-plus/test";
import readForm from "../src/form/readForm";
import type { FormValues } from "../src/form/readForm";

function form(entries: Record<string, string | string[]>): FormData {
	const formData = new FormData();
	for (const [key, value] of Object.entries(entries)) {
		if (Array.isArray(value)) {
			for (const v of value) formData.append(key, v);
		} else {
			formData.append(key, value);
		}
	}
	return formData;
}

describe("readForm", () => {
	test("coerces fields by their default value types", async () => {
		const data = await readForm(
			form({ title: "Hello", done: "on", priority: "2", tags: ["a", "b"] }),
			{ title: "", done: false, priority: 0, tags: [] as string[] },
		);
		expect(data).toEqual({
			title: "Hello",
			done: true,
			priority: 2,
			tags: ["a", "b"],
		});
	});

	test("falls back to defaults for missing fields", async () => {
		const data = await readForm(form({}), {
			title: "fallback",
			done: false,
			priority: 5,
		});
		expect(data).toEqual({ title: "fallback", done: false, priority: 5 });
	});

	test("falls back to defaults for uncoercible values", async () => {
		const data = await readForm(form({ priority: "not a number" }), { priority: 3 });
		expect(data.priority).toBe(3);
	});

	test("booleans follow checkbox semantics", async () => {
		const data = await readForm(form({ on: "on", off: "off", empty: "", explicitTrue: "true" }), {
			on: false,
			off: false,
			empty: false,
			explicitTrue: false,
		});
		expect(data.on).toBe(true);
		expect(data.off).toBe(false);
		expect(data.empty).toBe(false);
		expect(data.explicitTrue).toBe(true);
	});

	test("accepts a Request with a form body", async () => {
		const request = new Request("http://localhost/action", {
			method: "POST",
			body: form({ text: "ok" }),
		});
		const data = await readForm(request, { text: "" });
		expect(data.text).toBe("ok");
	});

	test("infers the values type from the spec", async () => {
		type Spec = { title: string; done: boolean; priority: number; tags: string[] };
		type Values = FormValues<Spec>;
		const values: Values = {
			title: "a",
			done: true,
			priority: 1,
			tags: ["x"],
		};
		// @ts-expect-error 'nope' is not a field of the spec
		void values.nope;
		// @ts-expect-error 'done' is a boolean
		void (values.done satisfies string);
		expect(values).toBeTruthy();
	});
});
