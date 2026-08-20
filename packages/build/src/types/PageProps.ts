/**
 * The props passed to a page (or layout) component: the data accumulated from
 * load functions, plus the result of the last form action if any.
 */
export default interface PageProps<Data = Record<string, any>, Form = Record<string, any>> {
	/**
	 * Data loaded by the page's (and its layouts') load functions.
	 */
	data: Data;
	/**
	 * The JSON result of the last form action, if a form was submitted.
	 */
	form: Form | undefined;
}
