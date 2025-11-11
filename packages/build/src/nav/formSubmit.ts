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
	const action = (e.submitter as HTMLButtonElement)?.formAction ?? form.action;
	const options = {
		body: new FormData(form),
		method: "POST",
		mode: "cors",
		credentials: "same-origin",
		// Add a special header which tells the server that we want the raw
		// error response (if applicable) rather than the reloaded page that you
		// would get if submitting a page without javascript
		headers: {
			"x-torpor-form-submit": "",
		},
	};
	const response = await fetch(
		action,
		// @ts-ignore -- don't know what it's complaining about here
		options,
	);

	if (response.status === 200 && response.headers.has("x-torpor-form-redirect")) {
		// TODO: Should do the correct type of redirect e.g. seeOther etc
		const redirect = response.headers.get("location")!;
		await load(redirect);
		window.location.href = redirect;
	} else if (
		(response.status >= 200 && response.status <= 299) ||
		(response.status >= 400 && response.status <= 499)
	) {
		// Put the response into `$page.form`, and it will be put into `$props` in reload
		if (response.headers.get("content-type") === "application/json") {
			$page.form = await response.json();
		}
		await reload();
	}
}
