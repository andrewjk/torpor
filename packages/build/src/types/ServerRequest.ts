import type { RouteParamsOf } from "./ParseRouteParams";
import type { FormDataRecord, QueryRecord } from "./ServerLoadEvent";
import type ServerLoadEvent from "./ServerLoadEvent";

type ServerRequest<
	Route extends string | undefined = undefined,
	Body = unknown,
	FormBody = FormDataRecord,
	QueryBody = QueryRecord,
	Params = RouteParamsOf<Route>,
> = (
	event: ServerLoadEvent<Route, Body, FormBody, QueryBody, Params>,
) => Response | undefined | void | Promise<Response | undefined | void>;

export default ServerRequest;
