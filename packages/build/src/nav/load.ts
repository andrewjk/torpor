import navigate from "./navigate";

/**
 * Loads and renders the page at the supplied path. Returns whether the page
 * was rendered in place: `false` when the document has to take over (a
 * `+server` route, a redirect, or a failed navigation), or when a newer
 * navigation superseded this one before it committed.
 */
export default async function load(path: string): Promise<boolean> {
	const url = new URL(path, document.location.href);
	return (await navigate(url)).type === "rendered";
}
