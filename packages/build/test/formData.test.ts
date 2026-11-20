import { expect, test } from "vite-plus/test";
import ok from "../src/response/ok";
import unprocessable from "../src/response/unprocessable";
import ServerEvent from "../src/server/ServerEvent";
import Router from "../src/site/Router";
import { createServerLoad } from "../src/site/serverHandlers";
import type PageServerEndPoint from "../src/types/PageServerEndPoint";
import type PageServerAction from "../src/types/PageServerAction";
import type { StandardSchemaV1 } from "../src/types/StandardSchema";
import type ManifestRoute from "../src/types/ManifestRoute";

/**
 * A schema uppercasing the `title` field, like a real validation schema
 * (zod, valibot, arktype) would.
 */
const formSchema: StandardSchemaV1<{ title: string }, { title: string }> = {
	"~standard": {
		version: 1,
		vendor: "test",
		validate: (value) => {
			const input = value as { title?: unknown } | undefined;
			if (typeof input?.title !== "string") {
				return { issues: [{ message: "title is required", path: ["title"] }] };
			}
			return { value: { title: input.title.toUpperCase() } };
		},
		types: { input: undefined as any, output: undefined as any },
	},
};

/**
 * What each action saw: the `form()` record and the `formData()` standard
 * object's values for the repeated `title` field.
 */
const seen: { form: unknown; first: FormDataEntryValue | null; all: FormDataEntryValue[] }[] = [];

/**
 * An action reading the form both ways, like user code would.
 */
const action: PageServerAction = async (ev) => {
	const form = await ev.form();
	const formData = await ev.formData();
	seen.push({ form, first: formData.get("title"), all: formData.getAll("title") });
	return ok({ saved: true });
};

/**
 * A page server endpoint without a schema: `form()` returns the raw record.
 */
const plainServer = {
	actions: { default: action },
} satisfies PageServerEndPoint;

/**
 * A page server endpoint with a form schema: `form()` returns the schema's
 * validated output, and the schema validation consumes the request body.
 */
const schemaServer = {
	schema: { default: formSchema },
	actions: { default: action },
} satisfies PageServerEndPoint;

/**
 * A page server endpoint whose load reads the form data, so the action's
 * re-render (which builds a fresh event for the load) reads the body twice.
 */
const reloadServer = {
	load: async (ev) => {
		const form = await ev.form();
		seen.push({ form, first: null, all: [] });
		return Response.json({ loaded: true });
	},
	actions: {
		default: async (ev) => {
			// The action reads the form data, so the request body is consumed
			// before the re-render's load runs
			await ev.form();
			return unprocessable({ message: "email is invalid" });
		},
	},
} satisfies PageServerEndPoint;

const component = () => ({ body: "", head: "" });

function makeLoad(pageServer: PageServerEndPoint) {
	const routes: ManifestRoute[] = [
		{
			path: "/posts",
			type: 0,
			endPoint: () => Promise.resolve({ default: { component } }),
			subFolder: undefined,
		},
		{
			path: "/posts/~server",
			type: 1,
			endPoint: () => Promise.resolve({ default: pageServer }),
			subFolder: undefined,
		},
	];
	return createServerLoad(new Router().addPages(routes));
}

/**
 * A form submit posting a `title` field twice (or with the given values).
 * With `clientSubmit` (the default) the request carries the header the
 * client's fetch sets, so the action's response is returned as-is; without
 * it, a 4xx action re-renders the page like a no-javascript form post.
 */
function post(titles: string[] = ["hello", "world"], clientSubmit = true): ServerEvent {
	const formData = new FormData();
	for (const title of titles) {
		formData.append("title", title);
	}
	return new ServerEvent(
		new Request("http://localhost/posts", {
			method: "POST",
			body: formData,
			headers: clientSubmit ? { "X-Torpor-Form-Submit": "1" } : {},
		}),
	);
}

const template = "<html><head>%COMPONENT_HEAD%</head><body>%COMPONENT_BODY%</body></html>";

test("form() returns a record and formData() the standard object", async () => {
	seen.length = 0;
	const load = makeLoad(plainServer);

	const res = await load(post(), template);

	expect(res.status).toBe(200);
	// form(): one value per field, an array when a field repeats
	expect(seen[0].form).toEqual({ title: ["hello", "world"] });
	// formData(): the web standard object, so the usual accessors work
	expect(seen[0].first).toBe("hello");
	expect(seen[0].all).toEqual(["hello", "world"]);
});

test("formData() still works when a schema has consumed the body", async () => {
	seen.length = 0;
	const load = makeLoad(schemaServer);

	// A single value, so the schema's `title: string` validates
	const res = await load(post(["hello"]), template);

	expect(res.status).toBe(200);
	// form() is the schema's validated output ...
	expect(seen[0].form).toEqual({ title: "HELLO" });
	// ... while formData() is the raw standard object, still readable after
	// the validation parsed the body (reading it twice used to throw)
	expect(seen[0].first).toBe("hello");
});

test("a load during the action's re-render can still read the form data", async () => {
	seen.length = 0;
	const load = makeLoad(reloadServer);

	// The action returns 422, so the page is re-rendered (like a no-javascript
	// form post) and its load runs with a fresh event -- which shares the
	// event's parsed form data instead of reading the body a second time
	const res = await load(post(["hello", "world"], false), template);

	expect(res.status).toBe(422);
	const html = await res.text();
	expect(html).toContain("email is invalid");
	// The load saw the submitted values
	expect(seen[0].form).toEqual({ title: ["hello", "world"] });
});
