import type { RouteParamsOf } from "./ParseRouteParams";
import type { FormDataRecord, QueryRecord } from "./ServerLoadEvent";
import type ServerLoadEvent from "./ServerLoadEvent";

type PageServerAction<
	Route extends string | undefined = undefined,
	FormBody = FormDataRecord,
	Params = RouteParamsOf<Route>,
> = (
	event: ServerLoadEvent<Route, unknown, FormBody, QueryRecord, Params>,
) => Response | undefined | void | Promise<Response | undefined | void>;

export default PageServerAction;
