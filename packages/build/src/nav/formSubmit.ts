import $page from "../state/$page";
import load from "./load";
import reload from "./reload";

export default async function formSubmit(e: SubmitEvent): Promise<void> {
	// We'll take it from here
	e.preventDefault();

	// Reset $page on submit and link navigation
	// TODO: Should we put data in $page.data??
	$page.form = undefined;

	// Perform a POST fetch to the form's action location
	const form = e.target as HTMLFormElement;
	const button = e.submitter as HTMLButtonElement;
	// HACK: submit buttons have their formAction set to the current page if not
	// set, so we can't just check whether it's empty and fallback to form action
	//const action = button?.formAction ?? form.action;
	let action = form.action || document.URL;
	if (button && button.formAction && button.formAction !== document.URL) {
		action = button.formAction;
	}
	const options = {
		body: new FormData(form),
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
	const response = await fetch(
		action,
		// @ts-ignore -- don't know what it's complaining about here
		options,
	);

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
	}
}
