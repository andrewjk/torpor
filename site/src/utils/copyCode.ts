export default async function copyCode(
	e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
) {
	const preEl = e.currentTarget.nextElementSibling;
	if (preEl && preEl instanceof HTMLPreElement) {
		await navigator.clipboard.writeText(preEl.innerText);
		alert('The code has been copied to the clipboard');
	}
}
