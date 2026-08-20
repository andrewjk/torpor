import type ServerLoadEvent from "./ServerLoadEvent";

type PageServerAction<Route extends string | undefined = undefined> = (
	event: ServerLoadEvent<Route>,
) => Response | undefined | void | Promise<Response | undefined | void>;

export default PageServerAction;
