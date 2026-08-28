import type ServerLoadEvent from "./ServerLoadEvent";
import type { FormDataRecord } from "./ServerLoadEvent";

type PageServerAction<Route extends string | undefined = undefined, FormBody = FormDataRecord> = (
	event: ServerLoadEvent<Route, unknown, FormBody>,
) => Response | undefined | void | Promise<Response | undefined | void>;

export default PageServerAction;
