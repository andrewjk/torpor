import { type Component } from "@torpor/view";
import type PageLoadEvent from "./PageLoadEvent";

/**
 * For +page.
 */
export default interface PageEndPoint {
	/**
	 * Builds the route path for the page in a type-safe manner.
	 * TODO: Not sure this is actually the best way to do it...
	 */
	route?: (...args: any[]) => string;
	/**
	 * Loads data for the page.
	 */
	load?: (
		event: PageLoadEvent,
	) => Response | undefined | void | Promise<Response | undefined | void>;
	/**
	 * The component that is displayed for the page.
	 */
	component?: Component;
	// TODO: Better typing
	/**
	 * The head element data for the page, which may include a <title> and <meta> elements.
	 */
	head?: HeadElement[] | ((event: PageLoadEvent) => HeadElement[]);
}

type HeadElement = TitleElement | MetaElement;

interface TitleElement {
	title: string;
}

interface MetaElement {
	name: string;
	content: string;
}
