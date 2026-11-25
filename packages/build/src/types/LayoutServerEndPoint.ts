import type PageServerEndPoint from "./PageServerEndPoint";
import type { PageServerActionSchemas } from "./PageServerEndPoint";

/**
 * For _layout.server. The same as a `PageServerEndPoint`, except that it
 * can't declare `middleware`: layout loads run for the pages below them, but
 * not for the API endpoints (`+server.ts`) in the same folders, so a guard
 * here would leave those open. Guard a folder with a `_hook.server.ts`,
 * which runs for every request below it.
 */
type LayoutServerEndPoint<
	Route extends string | undefined = undefined,
	Data = Record<string, any>,
	Schemas extends PageServerActionSchemas = PageServerActionSchemas,
> = Omit<PageServerEndPoint<Route, Data, Schemas>, "middleware"> & {
	/**
	 * Not supported on layouts, and an error at runtime. Use a
	 * `_hook.server.ts` in the layout's folder to guard it.
	 */
	middleware?: never;
};

export default LayoutServerEndPoint;
