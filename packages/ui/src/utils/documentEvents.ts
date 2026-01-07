export function addDocumentEvent<K extends keyof DocumentEventMap>(
	type: K,
	listener: (this: Document, ev: DocumentEventMap[K]) => any,
): void {
	if (typeof document !== "undefined") {
		document.addEventListener(type, listener);
	}
}

export function removeDocumentEvent<K extends keyof DocumentEventMap>(
	type: K,
	listener: (this: Document, ev: DocumentEventMap[K]) => any,
): void {
	if (typeof document !== "undefined") {
		document.removeEventListener(type, listener);
	}
}
