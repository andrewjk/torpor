import $page from "../state/$page";
import load from "./load";
import reload from "./reload";

/**
 * The detail of the `torpor:submit-failed` window event.
 */
export type SubmitFailureDetail = {
	/** The url the form was submitted to. */
	action: string;
	/** The failure that stopped the submit. */
	error?: unknown;
};

export default async function formSubmit(e: SubmitEvent): Promise<void> {
	// We'll take it from here
	e.preventDefault();

	// Reset $page on submit and link navigation
	// TODO: Should we put data in $page.data??
	$page.form = undefined;

	// Perform a POST fetch to the form's action location
	const form = e.target as HTMLFormElement;
	const button = e.submitter as HTMLButtonElement | null;
	// HACK: submit buttons have their formAction set to the current page if not
	// set, so we can't just check whether it's empty and fallback to form action
	//const action = button?.formAction ?? form.action;
	let action = form.action || document.URL;
	if (button && button.formAction && button.formAction !== document.URL) {
		action = button.formAction;
	}
	const options = {
		body: button ? new FormData(form, button) : new FormData(form),
		method: "POST",
		mode: "cors",
		credentials: "same-origin",
		// Add a special header which tells the server that we want the raw
		// error response (if applicable) rather than the reloaded page that you
		// would get if submitting a page without javascript
		headers: {
			"X-Torpor-Form-Submit": "",
		},
	};
	let response: Response;
	try {
		response = await fetch(
			action,
			// @ts-ignore -- don't know what it's complaining about here
			options,
		);
	} catch (error) {
		// A rejected fetch is a failed submission -- offline, or the server
		// couldn't be reached. Nothing navigates and the form keeps what the
		// user typed, so the app can show its own notice and let them retry.
		console.error("The form submit failed", error);
		handleSubmitFailure(form, action, error);
		return;
	}

	if (
		response.status === 200 &&
		response.headers.has("Content-Disposition") &&
		/attachment;\s*filename="(.+?)"/.test(response.headers.get("Content-Disposition")!)
	) {
		// TODO: Is this enough to check to see if we have a file that should download?
		// Download the file by creating a dummy <a> and clicking it
		const downloadFileName =
			response.headers.get("Content-Disposition")?.match(/attachment;\s*filename="(.+?)"/)![1] ??
			"file";
		const downloadLink = document.createElement("a");
		downloadLink.href = window.URL.createObjectURL(await response.blob());
		downloadLink.download = downloadFileName;
		downloadLink.click();
	} else if (response.status === 200 && response.headers.has("X-Torpor-Form-Redirect")) {
		// TODO: Should do the correct type of redirect e.g. seeOther etc
		const redirect = response.headers.get("Location")!;
		await load(redirect);
		window.location.href = redirect;
	} else if (
		(response.status >= 200 && response.status <= 299) ||
		(response.status >= 400 && response.status <= 499)
	) {
		// Put the response into `$page.form`, and it will be put into `$props` in reload
		if (response.headers.get("Content-Type") === "application/json") {
			$page.form = await response.json();
		}
		await reload();
	} else if (response.status >= 500) {
		// A server error: like a no-javascript submit, the response is the
		// error page rendered at this url with the error status. Swap the
		// document for it -- the url stays, so a transient failure can be
		// retried with a refresh. Without an error page, reload, which will
		// show the raw error response instead
		if (response.headers.get("Content-Type")?.includes("text/html")) {
			const html = await response.text();
			document.open();
			document.write(html);
			document.close();
		} else {
			window.location.reload();
		}
	}
}

/**
 * Tells the app that a client form submission failed (offline, or the server
 * couldn't be reached), so it can show its own notice. The form keeps the
 * values the user typed, ready for the app to retry.
 *
 * Dispatched on `window` as a cancelable `torpor:submit-failed` `CustomEvent`.
 * An app that cancels it asks for a native form submission after all, e.g. a
 * service worker serves the POST, or the browser's own offline handling is
 * preferred.
 */
function handleSubmitFailure(form: HTMLFormElement, action: string, error: unknown): void {
	const event = new CustomEvent<SubmitFailureDetail>("torpor:submit-failed", {
		cancelable: true,
		detail: { action, error },
	});
	// `dispatchEvent` returns false when a handler cancelled it
	if (!window.dispatchEvent(event)) {
		// The prototype call, because a field named "submit" shadows `form.submit`
		HTMLFormElement.prototype.submit.call(form);
		return;
	}

	console.warn(
		`The form submission to ${action} failed; staying on the current page. ` +
			"Listen for torpor:submit-failed to show your own notice.",
	);
}
