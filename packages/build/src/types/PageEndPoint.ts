import { type Component } from "@torpor/view";
import type { ExactRouteParams, ParseRouteParams, RouteParamsOf } from "./ParseRouteParams";
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
	 * Builds the route path for the page in a type-safe manner. The params
	 * object is checked for exact keys when `Route` is annotated.
	 *
	 * NOTE: The rest args conditional must stay INLINE — routing it through a
	 * type alias defeats `Params` inference, and excess keys stop being checked
	 */
	route?: <Params extends RouteParamsOf<Route>>(
		...args: Route extends string
			? string extends Route
				? [params?: Record<string, string>]
				: keyof ParseRouteParams<Route> extends never
					? []
					: [params: Params & ExactRouteParams<Params, ParseRouteParams<Route>>]
			: [params?: Record<string, string>]
	) => string;
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
