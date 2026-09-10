import { describe, expect, test } from "vite-plus/test";
import readForm from "../src/form/readForm";
import type { FormValues } from "../src/form/readForm";

function form(entries: Record<string, string | string[] | File | File[]>): FormData {
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

	test("reads a single file with the File class default", async () => {
		const avatar = new File(["avatar data"], "avatar.png", { type: "image/png" });
		const data = await readForm(form({ avatar, name: "Andrew" }), {
			avatar: File,
			name: "",
		});
		expect(data.avatar).toBeInstanceOf(File);
		expect(data.avatar!.name).toBe("avatar.png");
		expect(data.avatar!.type).toBe("image/png");
		expect(await data.avatar!.text()).toBe("avatar data");
		expect(data.name).toBe("Andrew");
	});

	test("returns undefined when no file was selected", async () => {
		const data = await readForm(form({}), { avatar: File });
		expect(data.avatar).toBeUndefined();
	});

	test("reads multiple files with a [File] array default", async () => {
		const one = new File(["one"], "one.txt");
		const two = new File(["two"], "two.txt");
		const data = await readForm(form({ photos: [one, two] }), { photos: [File] });
		expect(data.photos).toHaveLength(2);
		expect(data.photos[0].name).toBe("one.txt");
		expect(data.photos[1].name).toBe("two.txt");
	});

	test("returns an empty array when no files were selected", async () => {
		const data = await readForm(form({}), { photos: [File] });
		expect(data.photos).toEqual([]);
	});

	test("reads files from a multipart request body", async () => {
		const request = new Request("http://localhost/action", {
			method: "POST",
			body: form({
				title: "Hello",
				avatar: new File(["data"], "avatar.png", { type: "image/png" }),
			}),
		});
		expect(request.headers.get("Content-Type")).toMatch(/^multipart\/form-data/);
		const data = await readForm(request, { title: "", avatar: File });
		expect(data.title).toBe("Hello");
		expect(data.avatar!.name).toBe("avatar.png");
	});

	test("infers the values type from the spec", async () => {
		type Spec = {
			title: string;
			done: boolean;
			priority: number;
			tags: string[];
			avatar: typeof File;
			photos: (typeof File)[];
		};
		type Values = FormValues<Spec>;
		const values: Values = {
			title: "a",
			done: true,
			priority: 1,
			tags: ["x"],
			avatar: undefined,
			photos: [],
		};
		// @ts-expect-error 'nope' is not a field of the spec
		void values.nope;
		// @ts-expect-error 'done' is a boolean
		void (values.done satisfies string);
		// @ts-expect-error 'avatar' is a file
		void (values.avatar satisfies string);
		// @ts-expect-error 'photos' is a file array
		void (values.photos satisfies string[]);
		expect(values).toBeTruthy();
	});
});
