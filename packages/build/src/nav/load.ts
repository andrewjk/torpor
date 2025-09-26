import navigate from "./navigate";

/**
 * Loads and renders the page at the supplied path.
 */
export default async function load(path: string): Promise<boolean> {
	const url = new URL(path, document.location.href);
	return await navigate(url);
}
