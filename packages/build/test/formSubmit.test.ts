// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vite-plus/test";
import formSubmit from "../src/nav/formSubmit";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
	fetchMock.mockReset();
});

/**
 * Submits a form like the runtime does: a form without a submitter, posted
 * to its action url.
 */
function submit(): Promise<void> {
	const form = document.createElement("form");
	form.setAttribute("action", "http://localhost/posts");
	const event = {
		preventDefault: () => {},
		target: form,
		submitter: undefined,
	} as unknown as SubmitEvent;
	return formSubmit(event);
}

test("the submitter's name/value is included in the request body", async () => {
	// A FormData built from the form alone excludes submit buttons; the
	// clicked submitter must be passed to the constructor explicitly
	const form = document.createElement("form");
	form.setAttribute("action", "http://localhost/posts");
	form.innerHTML =
		'<button name="response" value="yes">Yes</button><button name="response" value="no">No</button>';
	document.body.append(form);
	const event = {
		preventDefault: () => {},
		target: form,
		submitter: form.querySelectorAll("button")[1],
	} as unknown as SubmitEvent;

	fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

	await formSubmit(event);

	const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
	expect(options.body).toBeInstanceOf(FormData);
	expect((options.body as FormData).get("response")).toBe("no");
});

test("a 5xx response replaces the document with the error page", async () => {
	// The server renders the error page at the form's url with the error
	// status; the document is swapped for it without a navigation, so the
	// address bar keeps the url (a transient failure can be retried with a
	// refresh)
	fetchMock.mockResolvedValue(
		new Response("<html><head><title>error</title></head><body><p>error page</p></body></html>", {
			status: 500,
			headers: { "Content-Type": "text/html" },
		}),
	);

	await submit();

	expect(fetchMock).toHaveBeenCalledWith(
		"http://localhost/posts",
		expect.objectContaining({ method: "POST" }),
	);
	expect(document.title).toBe("error");
	expect(document.body.innerHTML).toContain("error page");
});
