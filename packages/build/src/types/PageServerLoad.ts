import type { RouteParamsOf } from "./ParseRouteParams";
import type { PageLoadReturn } from "./PageLoadReturn";
import type { FormDataRecord, QueryRecord } from "./ServerLoadEvent";
import type ServerLoadEvent from "./ServerLoadEvent";

type PageServerLoad<
	Route extends string | undefined = undefined,
	Data = Record<string, any>,
	QueryBody = QueryRecord,
	Params = RouteParamsOf<Route>,
> = (
	event: ServerLoadEvent<Route, unknown, FormDataRecord, QueryBody, Params>,
) => PageLoadReturn<Data> | Promise<PageLoadReturn<Data>>;

export default PageServerLoad;
