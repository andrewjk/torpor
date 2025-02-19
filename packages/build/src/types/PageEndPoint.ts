import { type Component } from "@torpor/view";
import type PageEvent from "./PageEvent";

/**
 * For +page.
 */
type PageEndPoint = {
	/**
	 * Builds the route path for the page in a type-safe manner.
	 * TODO: Not sure this is actually the best way to do it...
	 */
	route?: (...args: any[]) => string;
	/**
	 * Loads data for the page.
	 */
	load?: (event: PageEvent) => any;
	/**
	 * The component that is displayed for the page.
	 */
	component?: Component;
	// TODO: Better typing
	/**
	 * The head element data for the page, which may include a <title> and <meta> elements.
	 */
	head?: HeadElement[] | ((event: PageEvent) => HeadElement[]);
};
export default PageEndPoint;

type HeadElement = TitleElement | MetaElement;

interface TitleElement {
	title: string;
}

interface MetaElement {
	name: string;
	content: string;
}
