// Adapted from https://github.com/sveltejs/svelte

const returnRegex = /\r/g;

export default function hash(input: string): string {
	input = input.replace(returnRegex, "");
	let hash = 5381;
	let i = input.length;
	while (i--) {
		hash = ((hash << 5) - hash) ^ input.charCodeAt(i);
	}
	return (hash >>> 0).toString(36);
}
