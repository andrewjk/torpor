/**
 * The client files each page needs, worked out from the client build's
 * manifest, as absolute paths like `/assets/x.js`: the client entry's, and
 * each page or layout route's (by route path).
 */
export default interface ModulePreloads {
	/** The client entry's chunks. */
	entry: string[];
	/** Each route's chunks (not repeating the entry's). */
	routes: Record<string, string[]>;
	/** The stylesheets the entry's and each route's chunks import. */
	styles: {
		entry: string[];
		routes: Record<string, string[]>;
		/**
		 * The scoped component styles (by style hash) each stylesheet
		 * contains, so the server render can leave out its inline copies.
		 */
		hashes: Record<string, string[]>;
	};
}
