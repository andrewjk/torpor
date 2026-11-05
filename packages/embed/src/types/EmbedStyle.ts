export default interface EmbedStyle {
	/**
	 * The generated CSS.
	 */
	style: string;

	/**
	 * The hash used to scope the CSS to the component.
	 */
	hash: string;
}
