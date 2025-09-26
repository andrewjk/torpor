import navigate from "./navigate";

/**
 * Reloads data for the currently loaded page and rerenders it.
 */
export default async function reload(): Promise<boolean> {
	const url = new URL(document.location.href);
	return await navigate(url);
}
