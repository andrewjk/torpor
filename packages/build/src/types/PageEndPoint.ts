import { type Component } from "@torpor/view";
import type { RouteArgsOf } from "./ParseRouteParams";
import type PageLoadEvent from "./PageLoadEvent";
import type { PageLoadReturn } from "./PageLoadReturn";

/**
 * For +page. Annotate with a route path to get typed params, and with a data
 * shape to flag loads that return keys the page doesn't expect, e.g.
 * `PageEndPoint<"/posts/[id]", PageData<typeof server>>`.
 */
export default interface PageEndPoint<
	Route extends string | undefined = undefined,
	Data = Record<string, any>,
> {
	/**
	 * Builds the route path for the page in a type-safe manner.
	 * TODO: Not sure this is actually the best way to do it...
	 */
	route?: (...args: RouteArgsOf<Route>) => string;
	/**
	 * Loads data for the page.
	 */
	load?: (event: PageLoadEvent<Route>) => PageLoadReturn<Data> | Promise<PageLoadReturn<Data>>;
	/**
	 * The component that is displayed for the page.
	 */
	component?: Component;
	// TODO: Better typing
	/**
	 * The head element data for the page, which may include a <title> and <meta> elements.
	 */
	head?: HeadElement[] | ((event: PageLoadEvent<Route>) => HeadElement[]);
}

type HeadElement = TitleElement | MetaElement;

interface TitleElement {
	title: string;
}

interface MetaElement {
	name: string;
	content: string;
}
