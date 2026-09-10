/**
 * Options for the `$async` getter primitive.
 */
export default interface AsyncOptions {
	/**
	 * Where the value comes from. The default (`"client"`) starts the fetch
	 * after hydration; `"server"` fetches during SSR and ships the resolved
	 * value embedded in the HTML (see ASYNC.md §7.10).
	 */
	source?: "client" | "server";

	/**
	 * With `source: "server"`, how long (ms) the server waits for this
	 * getter's promise before the enclosing `@await` boundary degrades to its
	 * `with` branch and the client fetches instead. Defaults to 5000.
	 */
	timeout?: number;
}
