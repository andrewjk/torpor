import Router from "../site/Router";
import type LayoutPath from "./LayoutPath";

export default interface ClientState {
	router: Router;
	layoutStack: LayoutPath[];
	prefetchedData: Record<string, any>;
	/**
	 * Server-data requests a prefetch has warmed, keyed by page path (+ query).
	 * The navigation that follows consumes its entry, so a prefetched response
	 * is only ever served to the one navigation it was loaded for.
	 */
	prefetchedServerData: Record<string, any>;
	/** Whether navigations run inside `document.startViewTransition` */
	viewTransitions: boolean;
}
