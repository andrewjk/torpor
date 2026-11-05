/**
 * A mounted iframe embed. Like EmbedHandle, but the iframe is the host's to
 * place and remove from the DOM; unmount stops listening for the frame's
 * messages and clears its document.
 */
export default interface EmbedFrameHandle {
	/**
	 * The iframe the embed was mounted into.
	 */
	iframe: HTMLIFrameElement;

	/**
	 * Stops listening for the frame's messages and clears the frame's
	 * document. Remove the iframe from the DOM afterwards.
	 */
	unmount(): void;
}
